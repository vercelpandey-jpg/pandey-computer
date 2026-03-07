import Category from "@/lib/models/Category";
import SubCategory from "@/lib/models/SubCategory";
import Brand from "@/lib/models/Brand";
import SubBrand from "@/lib/models/SubBrand";
import dbConnect from "@/lib/mongoose";

export async function GET() {
  try {
    await dbConnect();

    const [categories, subCategories, brands, subBrands] = await Promise.all([
      Category.find().select("_id name slug").sort({ name: 1 }).lean(),
      SubCategory.find()
        .select("_id name slug category")
        .sort({ name: 1 })
        .lean(),
      Brand.find().select("_id name slug logo").sort({ name: 1 }).lean(),
      SubBrand.find().select("_id name slug brand").sort({ name: 1 }).lean(),
    ]);

    return new Response(
      JSON.stringify({
        data: {
          categories,
          subCategories,
          brands,
          subBrands,
        },
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
    console.error("Error fetching filter options:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch filter options" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
