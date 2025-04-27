import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaUserCircle } from "react-icons/fa";

const Home: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("User signed in:", formData);
    alert(`Welcome, ${formData.username}!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B1F24] to-[#2A2D34] flex flex-col items-center justify-center p-4">
      {/* Logo and Heading */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl font-extrabold text-[#00D4FF] tracking-wide"
      >
        REALG
      </motion.h1>
      <p className="text-lg text-[#E5E7EB] mt-2">
        Empowering Safety, Ensuring Security.
      </p>

      {/* Sign-In Button */}
      {!showSignIn && (
        <motion.button
          onClick={() => setShowSignIn(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 bg-[#00D4FF] text-[#1B1F24] px-6 py-2 rounded-full font-semibold shadow-md hover:bg-[#009FCC] transition-all"
        >
          Sign In
        </motion.button>
      )}

      {/* Sign-In Form */}
      {showSignIn && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-6 w-full max-w-md bg-[#2F333B] p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-2xl text-[#00D4FF] font-bold mb-4">Sign In</h2>
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Username Input */}
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
                className="w-full px-4 py-2 text-sm text-white bg-[#1B1F24] border border-[#4B5563] rounded-md focus:outline-none focus:border-[#00D4FF]"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className="w-full px-4 py-2 text-sm text-white bg-[#1B1F24] border border-[#4B5563] rounded-md focus:outline-none focus:border-[#00D4FF]"
                required
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-[#00D4FF] text-[#1B1F24] px-4 py-2 rounded-md font-semibold hover:bg-[#009FCC] transition-all"
            >
              Sign In
            </button>
          </form>
          <p
            className="text-sm text-gray-400 mt-4 text-center cursor-pointer hover:text-[#00D4FF] transition-all"
            onClick={() => setShowSignIn(false)}
          >
            Cancel
          </p>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="mt-8 text-[#6B7280] text-sm">
        © {new Date().getFullYear()} REALG. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
