import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { env } from "@/config/env";
import { BCRYPT_COST } from "@/utils";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { usesB2, putB2Object } from "@/storage";
import { ensureArtDir, productShot, tile } from "./placeholder-art";

const prisma = new PrismaClient();

const SIZES = ["S", "M", "L", "XL", "XXL"];

type SeedProduct = {
  title: string;
  slug: string;
  description: string;
  fit: string;
  type: string;
  fabric: string;
  basePrice: number;
  mrp: number;
  colorName: string;
  colorHex: string;
  garment: string;
  bg: string;
  sleeve: "short" | "long";
  stock: number[];
  isNewArrival?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
};

const PRODUCTS: SeedProduct[] = [
  {
    title: "Blank Canvas Oversized Tee",
    slug: "blank-canvas-oversized-tee",
    description:
      "The one that started it all. A heavyweight 240 GSM cotton tee cut with a deliberately relaxed shoulder and a boxy hem that holds its shape wash after wash. No logos, no noise — just a clean silhouette that layers under everything you already own.",
    fit: "Oversized",
    type: "Plain",
    fabric: "240 GSM combed cotton, bio-washed",
    basePrice: 1099,
    mrp: 1499,
    colorName: "Off White",
    colorHex: "#F5F3EF",
    garment: "#EFEBE3",
    bg: "#DDD8CE",
    sleeve: "short",
    stock: [12, 24, 30, 14, 6],
    isBestseller: true,
    isFeatured: true,
  },
  {
    title: "Midnight Heavyweight Tee",
    slug: "midnight-heavyweight-tee",
    description:
      "A true black that stays black. Reactive-dyed heavyweight cotton with a ribbed collar that resists stretching, finished with a drop shoulder for an easy, lived-in drape.",
    fit: "Oversized",
    type: "Plain",
    fabric: "240 GSM combed cotton, reactive dyed",
    basePrice: 1099,
    mrp: 1499,
    colorName: "Black",
    colorHex: "#111111",
    garment: "#1A1A1A",
    bg: "#3A3A3A",
    sleeve: "short",
    stock: [18, 26, 22, 10, 3],
    isBestseller: true,
    isFeatured: true,
  },
  {
    title: "Olive Standard Crew",
    slug: "olive-standard-crew",
    description:
      "Our regular fit, cut closer through the body without pulling. Muted olive that reads neutral in daylight and deeper under lamps — the quiet third colour in a two-colour wardrobe.",
    fit: "Regular Fit",
    type: "Plain",
    fabric: "190 GSM cotton jersey",
    basePrice: 899,
    mrp: 1199,
    colorName: "Olive",
    colorHex: "#6B6B47",
    garment: "#6B6B47",
    bg: "#4E4E36",
    sleeve: "short",
    stock: [9, 15, 20, 12, 4],
    isNewArrival: true,
  },
  {
    title: "Hangar Type Graphic Tee",
    slug: "hangar-type-graphic-tee",
    description:
      "A single line of type across the chest, screen-printed with a soft-hand water-based ink that sinks into the fabric instead of sitting on top of it. Prints age with the shirt, not against it.",
    fit: "Oversized",
    type: "Graphic",
    fabric: "220 GSM cotton, water-based print",
    basePrice: 1249,
    mrp: 1699,
    colorName: "Charcoal",
    colorHex: "#3A3A3A",
    garment: "#3A3A3A",
    bg: "#5C5C5C",
    sleeve: "short",
    stock: [7, 12, 16, 8, 2],
    isNewArrival: true,
    isFeatured: true,
  },
  {
    title: "Rust Boxy Print Tee",
    slug: "rust-boxy-print-tee",
    description:
      "Short in the body, wide through the chest. An earthy rust ground with a small placed print at the back yoke — the kind of detail only visible when you walk away.",
    fit: "Boxy",
    type: "Printed",
    fabric: "220 GSM cotton, garment dyed",
    basePrice: 1199,
    mrp: 1599,
    colorName: "Rust",
    colorHex: "#B4552B",
    garment: "#B4552B",
    bg: "#8C401F",
    sleeve: "short",
    stock: [5, 11, 14, 9, 0],
    isNewArrival: true,
  },
  {
    title: "Sand Pique Polo",
    slug: "sand-pique-polo",
    description:
      "A collar that stands on its own. Structured cotton pique with tonal buttons and side vents, cut regular so it works tucked or loose.",
    fit: "Regular Fit",
    type: "Polo",
    fabric: "230 GSM cotton pique",
    basePrice: 1399,
    mrp: 1899,
    colorName: "Sand",
    colorHex: "#C9BCA4",
    garment: "#C9BCA4",
    bg: "#A99A80",
    sleeve: "short",
    stock: [6, 10, 13, 7, 3],
  },
  {
    title: "Navy Full Sleeve Tee",
    slug: "navy-full-sleeve-tee",
    description:
      "Full sleeve, mid weight, ribbed cuffs. Deep navy that behaves like a neutral — the transitional layer for the weeks that can't decide what season they are.",
    fit: "Regular Fit",
    type: "Full Sleeve",
    fabric: "210 GSM cotton jersey",
    basePrice: 1299,
    mrp: 1699,
    colorName: "Navy",
    colorHex: "#26334D",
    garment: "#26334D",
    bg: "#1A2436",
    sleeve: "long",
    stock: [8, 14, 18, 11, 5],
  },
  {
    title: "Bone Slim Crew",
    slug: "bone-slim-crew",
    description:
      "The closest cut we make. Fine-gauge cotton with a touch of stretch so it follows the shoulder line without clinging through the waist.",
    fit: "Slim Fit",
    type: "Plain",
    fabric: "180 GSM cotton with 5% elastane",
    basePrice: 849,
    mrp: 1099,
    colorName: "Off White",
    colorHex: "#F5F3EF",
    garment: "#F1EDE5",
    bg: "#C9C3B7",
    sleeve: "short",
    stock: [4, 9, 12, 6, 2],
  },
  {
    title: "Charcoal Oversized Long Sleeve",
    slug: "charcoal-oversized-long-sleeve",
    description:
      "Drop shoulder, extended sleeve, heavyweight body. Built to be worn on its own or pushed up over a lighter tee.",
    fit: "Oversized",
    type: "Full Sleeve",
    fabric: "250 GSM brushed cotton",
    basePrice: 1449,
    mrp: 1949,
    colorName: "Charcoal",
    colorHex: "#3A3A3A",
    garment: "#333333",
    bg: "#565656",
    sleeve: "long",
    stock: [3, 8, 10, 5, 1],
    isFeatured: true,
  },
  {
    title: "Olive Placement Print Tee",
    slug: "olive-placement-print-tee",
    description:
      "A large-scale placement print running off the hem, printed in a single tonal pass so the graphic reads as texture rather than a badge.",
    fit: "Oversized",
    type: "Printed",
    fabric: "230 GSM cotton, discharge print",
    basePrice: 1199,
    mrp: 1599,
    colorName: "Olive",
    colorHex: "#6B6B47",
    garment: "#5B5B3D",
    bg: "#43432C",
    sleeve: "short",
    stock: [0, 0, 0, 0, 0],
    isBestseller: true,
  },
];

async function reset() {
  await prisma.stockLog.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.settings.deleteMany();
}

async function main() {
  console.log("→ Clearing existing data…");
  await reset();

  console.log("→ Generating placeholder artwork…");
  ensureArtDir();

  // Real photography (free-licensed, downloaded to /public/uploads/photos — see that
  // directory's README) for the hero carousel and editorial band. Product imagery stays
  // generated art, since no stock photo matches a specific fictional product/colorway.
  const heroA = "/uploads/photos/hero-essentials.jpg";
  const heroB = "/uploads/photos/hero-heavyweight.jpg";
  const heroC = "/uploads/photos/hero-oversized.jpg";

  const categoryTiles = {
    tshirts: tile({ file: "cat-tshirts.svg", bg: "#3A3A3A", accent: "#6B6B47", label: "T-Shirts" }),
    shirts: tile({ file: "cat-shirts.svg", bg: "#C9BCA4", accent: "#6B6B47", label: "Shirts" }),
    bottomwear: tile({ file: "cat-bottomwear.svg", bg: "#26334D", accent: "#B4552B", label: "Bottomwear" }),
    hoodies: tile({ file: "cat-hoodies.svg", bg: "#6B6B47", accent: "#F5F3EF", label: "Hoodies" }),
    accessories: tile({ file: "cat-accessories.svg", bg: "#B4552B", accent: "#F5F3EF", label: "Accessories" }),
  };

  for (const t of ["Oversized", "Graphic", "Plain", "Polo", "Full Sleeve"]) {
    tile({
      file: `type-${t.toLowerCase().replace(/\s+/g, "-")}.svg`,
      bg: t === "Plain" ? "#DDD8CE" : t === "Polo" ? "#C9BCA4" : "#3A3A3A",
      accent: t === "Graphic" ? "#B4552B" : "#6B6B47",
      label: t,
    });
  }

  console.log("→ Creating categories…");
  const tshirts = await prisma.category.create({
    data: {
      name: "T-Shirts",
      slug: "t-shirts",
      description:
        "Heavyweight cotton tees cut for everyday wear — oversized, regular and slim fits in a tight, considered palette.",
      image: categoryTiles.tshirts,
      sortOrder: 1,
    },
  });

  await prisma.category.createMany({
    data: [
      { name: "Shirts", slug: "shirts", image: categoryTiles.shirts, comingSoon: true, sortOrder: 2 },
      { name: "Bottomwear", slug: "bottomwear", image: categoryTiles.bottomwear, comingSoon: true, sortOrder: 3 },
      { name: "Hoodies", slug: "hoodies", image: categoryTiles.hoodies, comingSoon: true, sortOrder: 4 },
      { name: "Accessories", slug: "accessories", image: categoryTiles.accessories, comingSoon: true, sortOrder: 5 },
    ],
  });

  console.log("→ Creating products and variants…");
  for (const p of PRODUCTS) {
    const front = productShot({
      file: `${p.slug}-1.svg`,
      bg: p.bg,
      garment: p.garment,
      label: p.title,
      sublabel: `${p.fit} · ${p.colorName}`,
      view: "front",
      sleeve: p.sleeve,
    });
    const back = productShot({
      file: `${p.slug}-2.svg`,
      bg: p.garment,
      garment: p.bg,
      label: p.title,
      sublabel: "Back view",
      view: "back",
      sleeve: p.sleeve,
    });

    const product = await prisma.product.create({
      data: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        categoryId: tshirts.id,
        fit: p.fit,
        type: p.type,
        fabric: p.fabric,
        careInstructions:
          "Machine wash cold with like colours. Do not bleach. Tumble dry low. Warm iron on reverse. Do not iron directly on print.",
        basePrice: p.basePrice,
        mrp: p.mrp,
        images: [front, back],
        status: "LIVE",
        isFeatured: p.isFeatured ?? false,
        isNewArrival: p.isNewArrival ?? false,
        isBestseller: p.isBestseller ?? false,
        variants: {
          create: SIZES.map((size, i) => ({
            size,
            color: p.colorName,
            colorHex: p.colorHex,
            sku: `BH-${p.slug.toUpperCase().replace(/-/g, "").slice(0, 10)}-${size}`,
            stock: p.stock[i],
          })),
        },
      },
    });

    console.log(`   ✓ ${product.title}`);
  }

  console.log("→ Creating users…");
  const adminPassword = env.seedAdminPassword;
  const admin = await prisma.user.create({
    data: {
      name: "Blank Hangar Admin",
      email: env.seedAdminEmail,
      passwordHash: await bcrypt.hash(adminPassword, BCRYPT_COST),
      role: "ADMIN",
      phone: "9000000000",
    },
  });

  await prisma.user.create({
    data: {
      name: "Blank Hangar Staff",
      email: "staff@theblankhangar.com",
      passwordHash: await bcrypt.hash("Staff@12345", BCRYPT_COST),
      role: "STAFF",
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Arjun Mehta",
      email: "customer@example.com",
      passwordHash: await bcrypt.hash("Customer@12345", BCRYPT_COST),
      role: "CUSTOMER",
      phone: "9812345678",
      addresses: {
        create: {
          fullName: "Arjun Mehta",
          line1: "402, Kalpataru Heights",
          line2: "Linking Road, Bandra West",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400050",
          phone: "9812345678",
          isDefault: true,
        },
      },
    },
    include: { addresses: true },
  });

  console.log("→ Creating a sample order with tracking history…");
  const sampleVariant = await prisma.productVariant.findFirst({
    where: { product: { slug: "midnight-heavyweight-tee" }, size: "L" },
    include: { product: true },
  });

  if (sampleVariant) {
    const price = sampleVariant.priceOverride ?? sampleVariant.product.basePrice;
    const subtotal = price * 2;
    const tax = Math.round(subtotal * 0.05);
    const order = await prisma.order.create({
      data: {
        orderNumber: "BHDEMO001",
        userId: customer.id,
        status: "SHIPPED",
        paymentStatus: "PAID",
        paymentMethod: "MOCK",
        paymentReference: "mock_pay_demo001",
        subtotal,
        shipping: 0,
        tax,
        discount: 0,
        total: subtotal + tax,
        shippingAddressId: customer.addresses[0].id,
        courierName: "Delhivery",
        trackingNumber: "DL2847193056IN",
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        items: {
          create: {
            productVariantId: sampleVariant.id,
            quantity: 2,
            priceAtPurchase: price,
            productTitle: sampleVariant.product.title,
            variantSize: sampleVariant.size,
            variantColor: sampleVariant.color,
            productImage: sampleVariant.product.images[0],
            productSlug: sampleVariant.product.slug,
          },
        },
      },
    });

    const timeline: { status: "PLACED" | "CONFIRMED" | "PACKED" | "SHIPPED"; hoursAgo: number; note: string }[] = [
      { status: "PLACED", hoursAgo: 72, note: "Order received." },
      { status: "CONFIRMED", hoursAgo: 68, note: "Payment confirmed." },
      { status: "PACKED", hoursAgo: 44, note: "Packed at Mumbai warehouse." },
      { status: "SHIPPED", hoursAgo: 20, note: "Handed to Delhivery — AWB DL2847193056IN." },
    ];

    for (const entry of timeline) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: entry.status,
          note: entry.note,
          changedByAdminId: admin.id,
          createdAt: new Date(Date.now() - entry.hoursAgo * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("→ Creating coupons…");
  await prisma.coupon.createMany({
    data: [
      {
        code: "BLANK10",
        description: "10% off your first order",
        discountType: "PERCENT",
        discountValue: 10,
        minOrderValue: 999,
        maxDiscount: 300,
        isActive: true,
      },
      {
        code: "FLAT200",
        description: "Flat ₹200 off orders above ₹1999",
        discountType: "FIXED",
        discountValue: 200,
        minOrderValue: 1999,
        isActive: true,
      },
    ],
  });

  console.log("→ Creating store settings…");
  await prisma.settings.create({
    data: {
      singleton: "SETTINGS",
      shippingCharge: 79,
      freeShippingThreshold: 1499,
      taxRatePercent: 5,
      lowStockThreshold: 5,
      announcementMessages: [
        "Free shipping on orders above ₹1499",
        "Drop 01 is live — heavyweight tees, limited run",
        "Easy 7-day returns on all orders",
      ],
      heroBanners: [
        {
          id: "hero-1",
          title: "Blank is a start",
          subtitle: "Drop 01 — heavyweight essentials, cut for everyday.",
          cta: "Shop T-Shirts",
          href: "/collections/t-shirts",
          image: heroA,
          sortOrder: 1,
          darkBackground: true,
        },
        {
          id: "hero-2",
          title: "Built to outlast",
          subtitle: "240 GSM combed cotton that holds its shape.",
          cta: "Shop Heavyweight",
          href: "/collections/t-shirts?fit=Oversized",
          image: heroB,
          sortOrder: 2,
          darkBackground: false,
        },
        {
          id: "hero-3",
          title: "Room to move",
          subtitle: "The oversized edit — drop shoulders, boxy hems.",
          cta: "Shop Oversized",
          href: "/collections/t-shirts?fit=Oversized",
          image: heroC,
          sortOrder: 3,
          darkBackground: true,
        },
      ],
    },
  });

  if (usesB2()) {
    console.log("→ Uploading seed images to Backblaze B2…");
    const root = join(process.cwd(), "public", "uploads");
    const types: Record<string, string> = {
      ".svg": "image/svg+xml",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    for (const sub of ["seed", "photos"]) {
      for (const f of readdirSync(join(root, sub))) {
        const type = types[extname(f).toLowerCase()];
        if (!type) continue;
        await putB2Object(`${sub}/${f}`, readFileSync(join(root, sub, f)), type);
      }
    }
  }

  console.log("\n✔ Seed complete.\n");
  console.log("  Admin    →", env.seedAdminEmail, "/", adminPassword);
  console.log("  Staff    → staff@theblankhangar.com / Staff@12345");
  console.log("  Customer → customer@example.com / Customer@12345\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
