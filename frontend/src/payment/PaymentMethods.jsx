// import React from 'react'
// import assets from '../assets/assets';

//  const PaymentMethods = ({selectedMethod,setSelectedMethod}) => {
//   return (
//     <div className="space-y-2" style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}>
//         <h3 className="font-semibold text-lg">Choose Payment Method</h3>
//         <div className="flex items-center gap-2">
//           <input
//             type="radio"
//             id="cod"
//             name="paymentMethod"
//             value="cod"
//             checked={selectedMethod === "cod"}
//             onChange={() => setSelectedMethod("cod")}
//           />
//           <label htmlFor="cod">Cash on Delivery (COD)</label>
//         </div>
//         <div className="flex items-center gap-2">
//           <input
//             type="radio"
//             id="online"
//             name="paymentMethod"
//             value="online"
//             checked={selectedMethod === "online"}
//             onChange={() => setSelectedMethod("online")}
//           />
//           <label htmlFor="online">Online Payment</label>
//         </div>
//       </div>
//   )

//   };
//   export default PaymentMethods