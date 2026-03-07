import Category from "@/lib/models/Category";
import dbConnect from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    await dbConnect();

    const data = await Category.find();

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
    console.error("Error fetching Category:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Category" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const { name, logo, showInHomepage } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 },
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const category = await Category.create({
      name,
      slug,
      logo,
      showInHomepage,
    });

    // Revalidate category-related pages
    revalidatePath("/categories");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json(
      { message: "Category created successfully", data: category },
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
    const { id, name, logo, showInHomepage } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 },
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        logo,
        showInHomepage,
      },
      { new: true },
    );

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    // Revalidate category-related pages
    revalidatePath("/categories");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json(
      { message: "Category updated successfully", data: category },
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
        { message: "Category ID is required" },
        { status: 400 },
      );
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    // Revalidate category-related pages
    revalidatePath("/categories");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json(
      { message: "Category deleted successfully" },
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
