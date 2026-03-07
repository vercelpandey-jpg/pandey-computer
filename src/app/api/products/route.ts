import Product from "@/lib/models/Product";
import Brand from "@/lib/models/Brand";
import SubBrand from "@/lib/models/SubBrand";
import Category from "@/lib/models/Category";
import SubCategory from "@/lib/models/SubCategory";

import dbConnect from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    await dbConnect();

    // Check if fetching single product by ID
    const id = searchParams.get("id");
    if (id) {
      const product = await Product.findById(id)
        .populate("categories", "name slug")
        .populate("subCategories", "name slug")
        .populate("brand", "name slug logo")
        .populate("subBrand", "name slug");

      if (!product) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ data: [product] }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    // Query parameters
    const page = parseInt(searchParams?.get("page") || "") || 1;
    const limit = parseInt(searchParams?.get("limit") || "") || 12;

    // Filter parameters (now using slugs)
    const name = searchParams.get("name");
    const categorySlug = searchParams.get("category");
    const subCategorySlug = searchParams.get("subCategory");
    const brandSlug = searchParams.get("brand");
    const subBrandSlug = searchParams.get("subBrand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    // Build filter query
    const filter: Record<string, unknown> = {};

    // Name search with regex
    if (name) {
      filter.name = { $regex: name.split(" ").join("|"), $options: "i" };
    }

    if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug }).select("_id");
      if (cat) filter.categories = { $in: [cat._id] };
    }

    if (subCategorySlug) {
      const subCat = await SubCategory.findOne({
        slug: subCategorySlug,
      }).select("_id");
      if (subCat) filter.subCategories = { $in: [subCat._id] };
    }

    if (brandSlug) {
      const brandDoc = await Brand.findOne({ slug: brandSlug }).select("_id");
      if (brandDoc) filter.brand = brandDoc._id;
    }

    if (subBrandSlug) {
      const subBrandDoc = await SubBrand.findOne({ slug: subBrandSlug }).select(
        "_id",
      );
      if (subBrandDoc) filter.subBrand = subBrandDoc._id;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        (filter.price as Record<string, number>).$gte = parseInt(minPrice);
      }
      if (maxPrice) {
        (filter.price as Record<string, number>).$lte = parseInt(maxPrice);
      }
    }

    // Calculate skip/offset for the database query
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Fetch products with pagination and populate references
    const data = await Product.find(filter)
      .populate("categories", "name slug")
      .populate("subCategories", "name slug")
      .populate("brand", "name slug logo")
      .populate("subBrand", "name slug")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    return new Response(
      JSON.stringify({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch products" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      name,
      keyFeatures,
      price,
      originalPrice,
      specs,
      categories,
      subCategories,
      brand,
      subBrand,
      images,
      stock,
      hotDeals,
      topSelling,
    } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Product name is required" },
        { status: 400 },
      );
    }

    if (price === undefined || price === null) {
      return NextResponse.json(
        { message: "Product price is required" },
        { status: 400 },
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const product = await Product.create({
      name,
      slug,
      keyFeatures: keyFeatures || [],
      price,
      originalPrice: originalPrice || undefined,
      specs: specs || undefined,
      categories: categories || [],
      subCategories: subCategories || [],
      brand: brand || undefined,
      subBrand: subBrand || undefined,
      images: images || [],
      stock: stock || false,
      hotDeals: hotDeals || false,
      topSelling: topSelling || false,
    });

    // Revalidate product-related pages
    revalidatePath(`/product/${slug}`);
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json(
      { message: "Product created successfully", data: product },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      id,
      name,
      keyFeatures,
      price,
      originalPrice,
      specs,
      categories,
      subCategories,
      brand,
      subBrand,
      images,
      stock,
      hotDeals,
      topSelling,
    } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { message: "Product name is required" },
        { status: 400 },
      );
    }

    if (price === undefined || price === null) {
      return NextResponse.json(
        { message: "Product price is required" },
        { status: 400 },
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        keyFeatures: keyFeatures || [],
        price,
        originalPrice: originalPrice || undefined,
        specs: specs || undefined,
        categories: categories || [],
        subCategories: subCategories || [],
        brand: brand || undefined,
        subBrand: subBrand || undefined,
        images: images || [],
        stock: stock || false,
        hotDeals: hotDeals || false,
        topSelling: topSelling || false,
      },
      { new: true },
    );

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    // Revalidate product-related pages
    revalidatePath(`/product/${slug}`);
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json(
      { message: "Product updated successfully", data: product },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 },
      );
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    // Revalidate product-related pages
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 },
    );
  }
}
