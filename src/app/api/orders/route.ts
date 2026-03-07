import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Order from "@/lib/models/Order";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { customerDetails, orderItems, totalAmount } = body;

    // Basic validation
    if (!customerDetails || !orderItems || !totalAmount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const order = await Order.create({
      customerDetails,
      orderItems,
      totalAmount,
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    // Sort by createdAt desc (newest first)
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json(
      { success: true, data: orders },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 },
    );
  }
}
