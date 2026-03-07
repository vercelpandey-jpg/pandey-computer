import Brand from "@/lib/models/Brand";
import SubBrand from "@/lib/models/SubBrand";
import dbConnect from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

export async function GET() {
  try {
    await dbConnect();

    const data = await SubBrand.find().populate("brand", "name slug logo");

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
    console.error("Error fetching SubBrand:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch SubBrand" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { name, brand_slug } = body;

    // validations
    if (!name) {
      return NextResponse.json(
        { message: "SubBrand name is required" },
        { status: 400 },
      );
    }

    if (!brand_slug) {
      return NextResponse.json(
        { message: "Brand slug is required" },
        { status: 400 },
      );
    }

    // find parent brand
    const brand = await Brand.findOne({ slug: brand_slug });
    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const data = await SubBrand.create({
      name,
      slug,
      brand: brand._id,
    });

    return NextResponse.json(
      { message: "SubBrand created successfully", data },
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
    const { id, name, brand_slug } = body;

    if (!id) {
      return NextResponse.json(
        { message: "SubBrand ID is required" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { message: "SubBrand name is required" },
        { status: 400 },
      );
    }

    if (!brand_slug) {
      return NextResponse.json(
        { message: "Brand slug is required" },
        { status: 400 },
      );
    }

    // find parent brand
    const brand = await Brand.findOne({ slug: brand_slug });
    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const data = await SubBrand.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        brand: brand._id,
      },
      { new: true },
    );

    if (!data) {
      return NextResponse.json(
        { message: "SubBrand not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "SubBrand updated successfully", data },
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
        { message: "SubBrand ID is required" },
        { status: 400 },
      );
    }

    const data = await SubBrand.findByIdAndDelete(id);

    if (!data) {
      return NextResponse.json(
        { message: "SubBrand not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "SubBrand deleted successfully" },
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
