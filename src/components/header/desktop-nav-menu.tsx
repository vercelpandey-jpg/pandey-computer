import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarItem {
  _id: string;
  label: string;
  slug: string;
  level: 1 | 2 | 3;
  type: "category" | "brand" | "subCategory" | "subBrand";
  children?: NavbarItem[];
}

interface DesktopNavMenuProps {
  topLevelItems: NavbarItem[];
  className?: string;
}

export default function DesktopNavMenu({
  topLevelItems,
  className,
}: DesktopNavMenuProps) {
  return (
    <nav
      className={cn("bg-primary text-white hidden lg:block h-full", className)}
    >
      <div className="relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center h-12 gap-1">
            {topLevelItems.map((menu) => (
              <div key={menu._id} className="group static">
                {/* Top Level */}
                <Link
                  href={`/shop?${menu.type}=${menu.slug}`}
                  className="flex items-center h-12 px-3 text-sm font-medium transition-colors whitespace-nowrap hover:bg-white hover:text-primary group-hover:bg-white group-hover:text-primary"
                >
                  {menu.label}
                  <ChevronDown className="ml-1 size-4 group-hover:rotate-180 transition-transform duration-300" />
                </Link>

                {/* Mega Menu Dropdown - Full width positioned under nav */}
                <div
                  className="absolute left-0 right-0 top-full
                            bg-white text-gray-800 shadow-2xl border-t-2 border-red-600
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible
                            transition-all duration-200 z-50"
                >
                  <div className="max-w-7xl mx-auto p-6">
                    <div
                      className="grid gap-4 text-sm w-full"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(
                          menu.children?.length || 0,
                          5,
                        )}, 1fr)`,
                      }}
                    >
                      {menu.children?.map((section) => (
                        <div key={section._id} className="min-w-0">
                          {/* Category/Brand Header */}
                          <Link
                            href={`/shop?${
                              section.type === menu.type
                                ? `${section.type}=${section.slug}`
                                : `${menu.type}=${menu.slug}&${section.type}=${section.slug}`
                            }`}
                            className="block"
                          >
                            <h4 className="text-black font-semibold hover:opacity-70 transition-colors pb-2 text-base">
                              {section.label}
                            </h4>
                          </Link>

                          {/* Subcategory Items */}
                          <ul className="space-y-2">
                            {section.children?.map((item) => (
                              <li key={item._id}>
                                <Link
                                  href={`/shop?${
                                    section.type === menu.type
                                      ? `${section.type}=${section.slug}&${item.type}=${item.slug}`
                                      : `${menu.type}=${menu.slug}&${section.type}=${section.slug}&${item.type}=${item.slug}`
                                  }`}
                                  className="block text-gray-700 hover:text-red-600 hover:translate-x-1 transition-all duration-150 w-fit truncate max-w-full"
                                  title={item.label}
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
