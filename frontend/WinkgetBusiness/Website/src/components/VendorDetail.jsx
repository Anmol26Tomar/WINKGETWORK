import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicVendorProfile } from '../services/vendorService';

const VendorDetail = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await getPublicVendorProfile(vendorId, true);
      setVendor(response);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching vendor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The vendor you are looking for does not exist.'}</p>
          <button
            onClick={handleBackClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={handleBackClick}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Vendor Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Banner Image */}
          <div className="h-64 bg-gray-200 flex items-center justify-center">
            {vendor.profileBanner ? (
              <img
                src={vendor.profileBanner}
                alt={`${vendor.shopName} banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-6xl font-bold">
                {vendor.shopName.charAt(0)}
              </div>
            )}
          </div>

          {/* Vendor Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {/* Profile Picture */}
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                  {vendor.businessProfilePic ? (
                    <img
                      src={vendor.businessProfilePic}
                      alt={vendor.shopName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">
                      {vendor.shopName.charAt(0)}
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {vendor.shopName}
                  </h1>
                  
                  {vendor.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-2">
                      {vendor.category}
                    </span>
                  )}

                  {/* Rating */}
                  {vendor.averageRating > 0 && (
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(vendor.averageRating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-gray-600">
                        {vendor.averageRating.toFixed(1)} ({vendor.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex space-x-3">
                {vendor.businessContact && (
                  <a
                    href={`tel:${vendor.businessContact}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </a>
                )}
                
                {vendor.socialLinks?.whatsapp && (
                  <a
                    href={`https://wa.me/${vendor.socialLinks.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* About Business */}
            {vendor.aboutBusiness && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">{vendor.aboutBusiness}</p>
              </div>
            )}

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              {vendor.businessAddress && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
                  <div className="text-gray-600">
                    {vendor.businessAddress.street && <p>{vendor.businessAddress.street}</p>}
                    <p>
                      {vendor.businessAddress.city}
                      {vendor.businessAddress.state && `, ${vendor.businessAddress.state}`}
                      {vendor.businessAddress.pincode && ` - ${vendor.businessAddress.pincode}`}
                    </p>
                    {vendor.businessAddress.country && <p>{vendor.businessAddress.country}</p>}
                  </div>
                </div>
              )}

              {/* Contact Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Details</h3>
                <div className="text-gray-600 space-y-1">
                  {vendor.businessContact && (
                    <p>📞 {vendor.businessContact}</p>
                  )}
                  {vendor.businessEmail && (
                    <p>📧 {vendor.businessEmail}</p>
                  )}
                  {vendor.websiteLink && (
                    <a
                      href={vendor.websiteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      🌐 Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            {vendor.socialLinks && Object.values(vendor.socialLinks).some(link => link) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Follow Us</h3>
                <div className="flex space-x-4">
                  {vendor.socialLinks.instagram && (
                    <a
                      href={vendor.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-800"
                    >
                      Instagram
                    </a>
                  )}
                  {vendor.socialLinks.facebook && (
                    <a
                      href={vendor.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Facebook
                    </a>
                  )}
                  {vendor.socialLinks.telegram && (
                    <a
                      href={vendor.socialLinks.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Telegram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Images */}
        {vendor.businessPosts && vendor.businessPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Photos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendor.businessPosts.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${vendor.shopName} photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {vendor.products && vendor.products.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendor.products.map((product) => (
                <div key={product._id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                  <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                  <p className="text-lg font-bold text-blue-600">₹{product.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDetail;
