import Brand from "@/lib/models/Brand";
import dbConnect from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    await dbConnect();

    const data = await Brand.find();

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
    console.error("Error fetching blogs:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch blogs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const { name, logo } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Brand name is required" },
        { status: 400 },
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const brand = await Brand.create({
      name,
      slug,
      logo,
    });

    // Revalidate brand-related pages
    revalidatePath("/brands");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json(
      { message: "Brand created successfully", data: brand },
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
    const { id, name, logo } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Brand ID is required" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { message: "Brand name is required" },
        { status: 400 },
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        logo,
      },
      { new: true },
    );

    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    // Revalidate brand-related pages
    revalidatePath("/brands");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json(
      { message: "Brand updated successfully", data: brand },
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
        { message: "Brand ID is required" },
        { status: 400 },
      );
    }

    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    // Revalidate brand-related pages
    revalidatePath("/brands");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json(
      { message: "Brand deleted successfully" },
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
