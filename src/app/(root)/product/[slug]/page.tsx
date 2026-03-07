import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { ProductImageGallery } from "@/components/reusable/products/product-image-gallery";
import { ProductSpecs } from "@/components/reusable/products/product-tabs";
import { RelatedProducts } from "@/components/reusable/products/related-products";
import { ProductActions } from "@/components/reusable/products/product-actions";
import { IProduct } from "@/lib/models/Product";
import dbConnect from "@/lib/mongoose";
import Product from "@/lib/models/Product";
import "@/lib/models/Category";
import "@/lib/models/SubCategory";
import "@/lib/models/Brand";
import "@/lib/models/SubBrand";

import { Types } from "mongoose";
import { GoDotFill } from "react-icons/go";
import { FaWhatsapp, FaFacebook } from "react-icons/fa";

async function getProduct(slug: string) {
  await dbConnect();

  const product = await Product.findOne({ slug })
    .populate("categories", "name slug")
    .populate("subCategories", "name slug")
    .populate("brand", "name slug logo")
    .populate("subBrand", "name slug")
    .lean();

  return JSON.parse(JSON.stringify(product)) as IProduct | null;
}

async function getRelatedProducts(
  categoryId: string | Types.ObjectId,
  currentProductId: string | Types.ObjectId,
) {
  await dbConnect();

  const products = await Product.find({
    categories: categoryId,
    _id: { $ne: currentProductId },
  })
    .populate("categories", "name slug")
    .populate("brand", "name slug logo")
    .limit(4)
    .lean();

  return JSON.parse(JSON.stringify(products)) as IProduct[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };

  const description = product.specs
    ? `${product.name} - ${Object.values(product.specs).slice(0, 3).join(", ")}. Available at Pandey Computer, Pokhara.`
    : `Buy ${product.name} at best price in Pokhara. Available at Pandey Computer.`;

  const keywords = [
    product.name,
    product.categories?.[0]?.name,
    product.brand?.name,
    "pokhara",
    "nepal",
    "computer store",
    "gaming",
  ].filter(Boolean);

  return {
    title: product.name,
    description: description.slice(0, 160),
    keywords,
    openGraph: {
      title: product.name,
      description: description.slice(0, 200),
      type: "website",
      siteName: "Pandey Computer",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: description.slice(0, 200),
    },
    alternates: {
      canonical: `/product/${slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const relatedProducts =
    product.categories && product.categories.length > 0
      ? await getRelatedProducts(
          product.categories[0]._id,
          product._id.toString(),
        )
      : [];

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  const specsArray = product.specs
    ? Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`)
    : [];

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: specsArray.join(", ") || product.name,
    brand: product.brand?.name
      ? {
          "@type": "Brand",
          name: product.brand.name,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/product/${slug}`,
      priceCurrency: "NPR",
      price: product.price,
      availability: product.stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Pandey Computer",
      },
    },
  };

  return (
    <div>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumb */}
      <div className="bg-muted py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-foreground">
              Shop
            </Link>
            <span>/</span>
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <section className="container mx-auto my-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="relative">
            <ProductImageGallery
              images={product.images || []}
              productName={product.name}
            />

            {discount > 0 && (
              <Badge
                variant="destructive"
                className="absolute top-4 right-4 text-sm font-bold px-3 py-1 shadow-lg text-white"
              >
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-2">
              {product.brand?.name || product.subBrand?.name || ""}
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-foreground mb-3">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline flex-wrap gap-3 mb-4">
              <span className="text-xl text-primary font-medium">
                Rs.{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  Rs.{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-4">
              {product.stock ? (
                <span className="text-green-600 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>In
                  Stock
                </span>
              ) : (
                <span className="text-red-600 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>Out
                  of Stock
                </span>
              )}
            </div>

            <ProductActions product={product} />

            {/* Share Buttons */}
            <div className="flex items-center gap-3 my-4">
              <span className="text-sm font-medium text-muted-foreground">
                Share:
              </span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Check out ${product.name} - Rs.${product.price.toLocaleString()} at ${process.env.NEXT_PUBLIC_BASE_URL || "https://pandeycomputer.com"}/product/${product.slug}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
              >
                <FaWhatsapp className="size-5" />
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `${process.env.NEXT_PUBLIC_BASE_URL || "https://pandeycomputer.com"}/product/${product.slug}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <FaFacebook className="size-5" />
                <span className="text-sm font-medium">Facebook</span>
              </a>
            </div>

            {/* Key Features */}
            {product?.keyFeatures && product.keyFeatures?.length > 0 && (
              <div className="text-sm text-muted-foreground my-4">
                <h3 className="text-black text-sm font-semibold mb-2">
                  Key Features
                </h3>
                {product?.keyFeatures?.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 mt-1.5">
                    <div className="mt-1 text-primary shrink-0">
                      <GoDotFill className="size-3" />
                    </div>
                    <p className="text-muted-foreground text-sm">{f}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10">
          <ProductSpecs specs={specsArray} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <RelatedProducts
            products={relatedProducts}
            currentProductId={product._id.toString()}
          />
        )}
      </section>
    </div>
  );
}
