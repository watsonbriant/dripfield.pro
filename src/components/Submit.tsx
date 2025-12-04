import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';

export function Submit() {
  const [formData, setFormData] = useState({
    submissionType: '',
    contactEmail: '',
    details: '',
    confirmationCode: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmationError, setConfirmationError] = useState(false);

  const submissionTypes = [
    'Setlist Correction',
    'Setlist Submission',
    'Bandcamp/YouTube/Release Information',
    'Guest Information',
    'Song Correction',
    'Setlist Game Issue/Bug',
    'Site Issue/Bug',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear confirmation error when user types in confirmation code field
    if (name === 'confirmationCode') {
      setConfirmationError(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setFileError('File size must be less than 50MB');
        setSelectedFile(null);
        return;
      }
      setFileError('');
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setConfirmationError(false);

    // Validate confirmation code
    if (formData.confirmationCode !== '726') {
      setConfirmationError(true);
      setIsSubmitting(false);
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      setSubmitError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    // Validate other fields
    if (!formData.submissionType) {
      setSubmitError('Please select a submission type.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.details.trim()) {
      setSubmitError('Please provide details for your submission.');
      setIsSubmitting(false);
      return;
    }

    try {
      let fileUrl = null;
      
      // Upload file if one is selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${new Date().toISOString()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `submissions/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('files') // Your bucket name
          .upload(filePath, selectedFile);
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Since your bucket is public, we can construct the URL directly
        fileUrl = `${supabase.storage.from('files').getPublicUrl(filePath).data.publicUrl}`;
      }
      
      // Insert data into bugs table with file URL
      const { error } = await supabase
        .from('bugs')
        .insert([
          {
            bug_type: formData.submissionType,
            bug_contactemail: formData.contactEmail,
            bug_detail: formData.details,
            bug_completion: false,
            bug_submissiondate: new Date().toISOString(),
            bug_file_url: fileUrl
          }
        ]);

      if (error) {
        throw error;
      }

      // Clear form on success
      setFormData({
        submissionType: '',
        contactEmail: '',
        details: '',
        confirmationCode: ''
      });
      setSelectedFile(null);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('An error occurred while submitting your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Submit — Dripfield.pro</title>
      </Helmet>
      <div className="max-w-3xl mx-auto shadow-xl">
      <div className="bg-primary border border-fourth">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h2 className="text-sm font-semibold">Submit Information</h2>
        </div>
        <div className="px-2 py-1">
          <p className="text-fifth text-[0.625rem] font-light mb-2">
            Use this form to submit corrections, new information, or report issues with the site.
          </p>

          {submitSuccess ? (
            <div className="bg-primary border border-fourth p-2 mb-2">
              <p className="text-xs font-medium text-fifth">Thank you for your submission!</p>
              <p className="text-[0.625rem] font-light text-fifth mt-1">We have received your information and will review it soon.</p>
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setSelectedFile(null);
                }}
                className="mt-2 px-2 py-0.5 bg-canvas hover:bg-tertiary text-fifth font-medium transition-colors border border-fourth text-xs"
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              {submitError && (
                <div className="bg-primary border border-fourth p-2">
                  <p className="text-xs text-fifth">{submitError}</p>
                </div>
              )}

              <div>
                <label htmlFor="submissionType" className="block text-xs font-medium text-fifth mb-0.5">
                  Submission Type <span className="text-red-600">*</span>
                </label>
                <select
                  id="submissionType"
                  name="submissionType"
                  value={formData.submissionType}
                  onChange={handleChange}
                  required
                  className="w-full px-2 py-0.5 bg-canvas border border-fourth text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                >
                  <option value="">&mdash;</option>
                  {submissionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-xs font-medium text-fifth mb-0.5">
                  Contact Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-2 py-0.5 bg-canvas font-light border border-fourth text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="ted@dripfield.pro"
                />
              </div>

              <div>
                <label htmlFor="details" className="block text-xs font-medium text-fifth mb-0.5">
                  Details <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-2 py-0.5 bg-canvas font-light border border-fourth text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Please provide as much detail as possible about your submission..."
                />
              </div>

              <div>
                <label htmlFor="file" className="block text-xs font-medium text-fifth mb-0.5">
                  Attach File (Optional)
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  accept="*/*"
                  className="w-full px-2 py-0.5 bg-canvas border border-fourth text-fifth text-xs file:mr-2 file:py-0.5 file:px-2 file:border-0 file:text-xs file:font-medium file:bg-tertiary file:text-fifth hover:file:bg-tertiary/80"
                />
                {selectedFile && (
                  <p className="mt-1 text-[0.625rem] text-fifth/70">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {fileError && (
                  <p className="mt-1 text-[0.625rem] text-red-600">{fileError}</p>
                )}
                <p className="mt-1 text-[0.625rem] text-fifth/60 font-light">Maximum file size: 50MB.</p>
              </div>

              <div>
                <label htmlFor="confirmationCode" className="block text-xs font-medium text-fifth mb-0.5">
                  Confirmation Code <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    id="confirmationCode"
                    name="confirmationCode"
                    value={formData.confirmationCode}
                    onChange={handleChange}
                    required
                    className={`px-2 py-0.5 bg-canvas font-light border ${confirmationError ? 'border-red-600' : 'border-fourth'} text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary w-24 text-xs`}
                    placeholder="&mdash;"
                  />
                  <span className={`ml-2 font-light text-[0.625rem] ${confirmationError ? 'text-red-600' : 'text-fifth/70'}`}>
                    {confirmationError ? 'Incorrect code. Please enter 726.' : 'Type the number 726 here.'}
                  </span>
                </div>
              </div>

              <div className="pt-1 text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-2 py-0.5 bg-tertiary hover:bg-canvas text-fifth font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none border border-fourth text-sm"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}