import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PlusCircle, AlertCircle, ArrowLeft, Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  'Electronics',
  'Tools & DIY',
  'Outdoors & Camping',
  'Home & Kitchen',
  'Books & Study',
  'Sports & Fitness',
  'Party & Games',
];

const AddItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    imageUrl: '',
    location: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WEBP)');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return null;
    const uploadData = new FormData();
    uploadData.append('file', selectedFile);

    setUploadingImage(true);
    try {
      const response = await api.post('/files/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.fileUrl;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let finalImageUrl = formData.imageUrl;

      // If user chose a file from their device, upload it first
      if (selectedFile) {
        finalImageUrl = await handleUploadImage();
      }

      await api.post('/items', {
        ...formData,
        imageUrl: finalImageUrl,
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to list item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-emerald-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">List an Item for Lending</h1>
          <p className="text-sm text-gray-500 mt-1">
            Share what you don't regularly use with your community
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Item Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Sony Alpha A6400 Camera or DeWalt Cordless Drill"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Location / Neighborhood</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Block C, North Campus"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Photo Upload Box */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Item Photo</label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="w-full sm:w-1/2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition bg-slate-50">
                <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-gray-700">Upload from Device</span>
                <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Preview */}
              <div className="w-full sm:w-1/2 h-36 rounded-2xl bg-slate-100 border border-gray-200 overflow-hidden flex items-center justify-center relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="URL Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">No image selected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional URL input */}
            <div className="mt-3">
              <span className="text-xs text-gray-400 block mb-1">Or paste an Image Web URL:</span>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value) setPreviewUrl('');
                }}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description & Guidelines</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe condition, accessories included, or any instructions for borrowers..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            {loading || uploadingImage ? 'Uploading & Publishing...' : 'List Item Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
