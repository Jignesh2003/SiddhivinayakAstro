import  { useState, useEffect } from 'react';
import axios from 'axios';

const VisitorPopup = ({ isAuthenticated }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            // Check if user has already submitted the form (permanent - localStorage)
            const hasSubmittedForm = localStorage.getItem('visitorFormSubmitted');

            // Check if user just closed it in this session (temporary - sessionStorage)
            const hasClosedThisSession = sessionStorage.getItem('visitorPopupClosed');

            // Only show if they haven't submitted AND haven't closed in this session
            if (!hasSubmittedForm && !hasClosedThisSession) {
                const timer = setTimeout(() => {
                    setIsOpen(true);
                }, 3000);

                const handleScroll = () => {
                    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                    if (scrollPercentage > 20 && !hasSubmittedForm && !hasClosedThisSession) {
                        setIsOpen(true);
                        window.removeEventListener('scroll', handleScroll);
                    }
                };

                window.addEventListener('scroll', handleScroll);

                return () => {
                    clearTimeout(timer);
                    window.removeEventListener('scroll', handleScroll);
                };
            }
        }
    }, [isAuthenticated]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phoneNumber') {
            const digitsOnly = value.replace(/\D/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: digitsOnly
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Name must be at least 2 characters';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage('');

        try {
            const response = await axios.post(`${import.meta.env.VITE_VISITOR_URL}/visitors`, {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber
            });

            if (response.data.success) {
                setSubmitMessage('Thank you for sharing your information!');

                // ✅ PERMANENT - Mark as submitted in localStorage (never show again)
                localStorage.setItem('visitorFormSubmitted', 'true');
                localStorage.setItem('visitorFormSubmittedDate', new Date().toISOString());

                setTimeout(() => {
                    setIsOpen(false);
                }, 2000);
            } else {
                setSubmitMessage(response.data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting visitor info:', error);

            // Handle different error types
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data?.message || 'Server error. Please try again.';
                setSubmitMessage(errorMessage);
            } else if (error.request) {
                // Request made but no response
                setSubmitMessage('Network error. Please check your connection and try again.');
            } else {
                // Something else happened
                setSubmitMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        // ⏱️ TEMPORARY - Only for this session (will show again on next visit)
        sessionStorage.setItem('visitorPopupClosed', 'true');
    };

    if (!isOpen || isAuthenticated) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
            onClick={handleClose}
        >
            {/* Dark Blurred Background */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

            {/* White Card Container */}
            <div
                className="relative w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Clean White Card */}
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Content */}
                    <div className="p-8 sm:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="text-5xl mb-4 animate-wave inline-block">👋</div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                                Welcome!
                            </h2>
                            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                                Join our community! Share your details to stay connected and get exclusive updates.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border ${errors.fullName
                                                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-gray-200 dark:border-gray-700 focus:border-teal-500 focus:ring-teal-500/20'
                                            } rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-medium`}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                {errors.fullName && (
                                    <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-shake">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label
                                    htmlFor="phoneNumber"
                                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        maxLength="10"
                                        disabled={isSubmitting}
                                        className={`w-full pl-12 pr-16 py-3.5 bg-gray-50 dark:bg-gray-800 border ${errors.phoneNumber
                                                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-gray-200 dark:border-gray-700 focus:border-teal-500 focus:ring-teal-500/20'
                                            } rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-medium`}
                                        placeholder="98XXXXXXXX"
                                    />
                                    {formData.phoneNumber && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                                            {formData.phoneNumber.length}/10
                                        </div>
                                    )}
                                </div>
                                {errors.phoneNumber && (
                                    <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-shake">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.phoneNumber}
                                    </p>
                                )}
                            </div>

                            {/* Submit Message */}
                            {submitMessage && (
                                <div className={`p-4 rounded-xl text-sm font-medium ${submitMessage.includes('Thank you')
                                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                                    } animate-slideDown`}>
                                    <div className="flex items-center gap-2">
                                        {submitMessage.includes('Thank you') ? (
                                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        {submitMessage}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="relative w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold text-base rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 focus:outline-none focus:ring-4 focus:ring-teal-500/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-teal-500 disabled:hover:to-teal-600 transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Your privacy is our priority. Information is secure.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style >{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(40px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        .animate-wave {
          animation: wave 0.6s ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default VisitorPopup;
