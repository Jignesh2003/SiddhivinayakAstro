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

//delete admin product
export  const deleteAdminProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal server error" });
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