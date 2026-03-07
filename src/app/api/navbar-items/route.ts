import NavbarItem from "@/lib/models/NavbarItem";
import Category from "@/lib/models/Category";
import SubCategory from "@/lib/models/SubCategory";
import Brand from "@/lib/models/Brand";
import SubBrand from "@/lib/models/SubBrand";
import dbConnect from "@/lib/mongoose";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const nested = searchParams.get("nested");

    // If nested query param is provided, return hierarchical structure
    if (nested === "true") {
      const level1Items = await NavbarItem.find({ level: 1 })
        .sort({ order: 1 })
        .lean();

      // Populate level 2 children for each level 1 item
      for (const item of level1Items) {
        const level2Children = await NavbarItem.find({
          parent: item._id,
          level: 2,
        })
          .sort({ order: 1 })
          .lean();

        // Populate level 3 children for each level 2 item
        for (const child of level2Children) {
          const level3Children = await NavbarItem.find({
            parent: child._id,
            level: 3,
          })
            .sort({ order: 1 })
            .lean();

          child.children = level3Children;
        }

        item.children = level2Children;
      }

      return new Response(JSON.stringify({ data: level1Items }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    // Default behavior: return flat list
    const query: Record<string, unknown> = {};
    if (level) {
      query.level = parseInt(level);
    }

    const items = await NavbarItem.find(query)
      .populate("parent", "label")
      .sort({ level: 1, order: 1 });

    return new Response(JSON.stringify({ data: items }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching navbar items:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch navbar items" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { type, referenceId, parent, order, level } = body;

    if (!type || !referenceId || !level) {
      return new Response(
        JSON.stringify({
          error: "Type, referenceId, and level are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate level restrictions
    if (
      (level === 1 || level === 2) &&
      type !== "category" &&
      type !== "brand"
    ) {
      return new Response(
        JSON.stringify({
          error: "Level 1 and Level 2 items can only be category or brand",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (level === 3 && type !== "subCategory" && type !== "subBrand") {
      return new Response(
        JSON.stringify({
          error: "Level 3 items can only be subCategory or subBrand",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate parent-level relationship
    if (parent) {
      const parentItem = await NavbarItem.findById(parent);
      if (!parentItem) {
        return new Response(
          JSON.stringify({ error: "Parent item not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Parent should be one level lower
      if (parentItem.level !== level - 1) {
        return new Response(
          JSON.stringify({
            error: `Level ${level} items must have a Level ${level - 1} parent`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } else if (level > 1) {
      // Level 2 and 3 should have a parent (though optional in schema)
      return new Response(
        JSON.stringify({
          error: `Level ${level} items should have a parent`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get label and slug from the referenced model
    let slug = "";
    let label = "";
    let modelRef;

    switch (type) {
      case "category":
        modelRef = await Category.findById(referenceId);
        break;
      case "brand":
        modelRef = await Brand.findById(referenceId);
        break;
      case "subCategory":
        modelRef = await SubCategory.findById(referenceId);
        break;
      case "subBrand":
        modelRef = await SubBrand.findById(referenceId);
        break;
    }

    if (!modelRef) {
      return new Response(
        JSON.stringify({ error: "Referenced item not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    slug = modelRef.slug;
    label = modelRef.name;

    const navbarItem = await NavbarItem.create({
      label,
      slug,
      type,
      referenceId,
      parent: parent || null,
      order: order || 0,
      level,
      children: [],
    });

    // If this item has a parent, add it to parent's children array
    if (parent) {
      await NavbarItem.findByIdAndUpdate(parent, {
        $addToSet: { children: navbarItem._id },
      });
    }

    // Revalidate all pages that use navigation
    revalidatePath("/", "layout");

    return new Response(JSON.stringify({ data: navbarItem }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating navbar item:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create navbar item" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
