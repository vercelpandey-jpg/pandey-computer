import HomeWallpaper from "@/lib/models/HomeWallpaper";
import dbConnect from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const wallpapers = await HomeWallpaper.find().sort({ order: 1 }).lean();

    return NextResponse.json(
      { data: wallpapers },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching wallpapers:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallpapers" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { title, image, route, order, gridSpan } = body;

    if (!title) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 },
      );
    }

    if (!image) {
      return NextResponse.json(
        { message: "Image URL is required" },
        { status: 400 },
      );
    }

    if (!route) {
      return NextResponse.json(
        { message: "Route is required" },
        { status: 400 },
      );
    }

    const wallpaper = await HomeWallpaper.create({
      title,
      image,
      route,
      order: order || 1,
      gridSpan: gridSpan || { cols: 1, rows: 1 },
    });

    // Revalidate home page
    revalidatePath("/");

    return NextResponse.json(
      { message: "Wallpaper created successfully", data: wallpaper },
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
    const { id, title, image, route, order, gridSpan } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Wallpaper ID is required" },
        { status: 400 },
      );
    }

    if (!title) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 },
      );
    }

    if (!image) {
      return NextResponse.json(
        { message: "Image URL is required" },
        { status: 400 },
      );
    }

    if (!route) {
      return NextResponse.json(
        { message: "Route is required" },
        { status: 400 },
      );
    }

    const wallpaper = await HomeWallpaper.findByIdAndUpdate(
      id,
      {
        title,
        image,
        route,
        order: order || 1,
        gridSpan: gridSpan || { cols: 1, rows: 1 },
      },
      { new: true },
    );

    if (!wallpaper) {
      return NextResponse.json(
        { message: "Wallpaper not found" },
        { status: 404 },
      );
    }

    // Revalidate home page
    revalidatePath("/");

    return NextResponse.json(
      { message: "Wallpaper updated successfully", data: wallpaper },
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
        { message: "Wallpaper ID is required" },
        { status: 400 },
      );
    }

    const wallpaper = await HomeWallpaper.findByIdAndDelete(id);

    if (!wallpaper) {
      return NextResponse.json(
        { message: "Wallpaper not found" },
        { status: 404 },
      );
    }

    // Revalidate home page
    revalidatePath("/");

    return NextResponse.json(
      { message: "Wallpaper deleted successfully" },
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
