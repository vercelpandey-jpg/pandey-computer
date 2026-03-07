import Category from "@/lib/models/Category";
import SubCategory from "@/lib/models/SubCategory";
import dbConnect from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

export async function GET() {
  try {
    await dbConnect();

    const data = await SubCategory.find().populate(
      "category",
      "name slug logo",
    );

    return new Response(
      JSON.stringify({
        data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching SubCategory:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch SubCategory" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const { name, category_slug } = body;

    if (!name) {
      return NextResponse.json(
        { message: "SubCategory name is required" },
        { status: 400 },
      );
    }

    if (!category_slug) {
      return NextResponse.json(
        { message: "Category slug is required" },
        { status: 400 },
      );
    }

    // find parent category
    const category = await Category.findOne({ slug: category_slug });
    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const data = await SubCategory.create({
      name,
      slug,
      category: category._id,
    });

    return NextResponse.json(
      { message: "SubCategory created successfully", data },
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
    const { id, name, category_slug } = body;

    if (!id) {
      return NextResponse.json(
        { message: "SubCategory ID is required" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { message: "SubCategory name is required" },
        { status: 400 },
      );
    }

    if (!category_slug) {
      return NextResponse.json(
        { message: "Category slug is required" },
        { status: 400 },
      );
    }

    // find parent category
    const category = await Category.findOne({ slug: category_slug });
    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const data = await SubCategory.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        category: category._id,
      },
      { new: true },
    );

    if (!data) {
      return NextResponse.json(
        { message: "SubCategory not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "SubCategory updated successfully", data },
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
        { message: "SubCategory ID is required" },
        { status: 400 },
      );
    }

    const data = await SubCategory.findByIdAndDelete(id);

    if (!data) {
      return NextResponse.json(
        { message: "SubCategory not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "SubCategory deleted successfully" },
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
