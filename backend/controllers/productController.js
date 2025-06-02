import Order from "../models/Order.js";
import Product from "../models/Product.js";

//get products list for user
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products from DB
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

//get single product detail
export const getSingleProductDetail = async(req,res)=>{
  try {
    const product = await Product.findById(req.params.id);    
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export const editAdminProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let imageUrl = product.image; // Keep existing image if no new one is uploaded

    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (product.image) {
        const publicId = product.image.split("/").pop().split(".")[0]; // Extract Cloudinary public ID
        await cloudinary.uploader.destroy(`products/${publicId}`);
      }
      imageUrl = req.file.path; // Multer uploads to Cloudinary, path contains new image URL
    }

    // Update product with new values
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name || product.name,
        price: price || product.price,
        description: description || product.description,
        stock: stock || product.stock,
        image: imageUrl,
      },
      { new: true } // Return updated document
    );

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAdminProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Find the product first (so we know its imagePublicId)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Remove the image from Cloudinary
    //    `imagePublicId` was saved when you uploaded the product
    if (product.imagePublicId) {
      const destroyResult = await cloudinary.uploader.destroy(product.imagePublicId);
      // destroyResult will be { result: "ok" } if success (or "not found" if it wasn’t there)
      // You can inspect `destroyResult` if you want to log or handle failures—but even if Cloudinary says “not found,” we’ll proceed to delete the DB doc.
    }

    // 3. Delete the product document from MongoDB
    await Product.findByIdAndDelete(productId);

    return res.json({ message: "Product and its image were deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//admin payment status || Mark an Order as Paid
export const markAsPaid = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find and update order payment status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: "paid" },
      { new: true } // Return updated order
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order marked as paid", order: updatedOrder });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}