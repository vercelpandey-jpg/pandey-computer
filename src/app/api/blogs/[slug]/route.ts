import Blog from "@/lib/models/Blog";
import dbConnect from "@/lib/mongoose";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;
  try {
    await dbConnect();

    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(
      { data: blog },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch blog" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;
  try {
    await dbConnect();

    const body = await request.json();
    const { title, excerpt, content, image } = body;

    if (!title || !content) {
      return Response.json(
        { error: "Title and content are required" },
        { status: 400 },
      );
    }

    // Generate new slug if title changed
    const newSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const blog = await Blog.findOneAndUpdate(
      { slug }, // Query by slug field
      {
        title,
        slug: newSlug,
        excerpt,
        content,
        image,
      },
      { new: true, runValidators: true },
    );

    if (!blog) {
      return Response.json({ error: "Blog not found" }, { status: 404 });
    }

    // Revalidate blog pages
    revalidatePath("/blogs");
    revalidatePath(`/blogs/${slug}`);
    revalidatePath(`/blogs/${newSlug}`);
    revalidatePath("/");

    return Response.json({ data: blog });
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;
  try {
    await dbConnect();

    const blog = await Blog.findOneAndDelete({ slug }); // Query by slug field

    if (!blog) {
      return Response.json({ error: "Blog not found" }, { status: 404 });
    }

    // Revalidate blog pages
    revalidatePath("/blogs");
    revalidatePath(`/blogs/${slug}`);
    revalidatePath("/");

    return Response.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}
