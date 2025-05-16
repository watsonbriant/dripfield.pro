import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Submit() {
  const [formData, setFormData] = useState({
    submissionType: '',
    contactEmail: '',
    details: '',
    confirmationCode: ''
  });
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
      // Insert data into bugs table
      const { error } = await supabase
        .from('bugs')
        .insert([
          {
            bug_type: formData.submissionType,
            bug_contactemail: formData.contactEmail,
            bug_detail: formData.details,
            bug_completion: false,
            bug_submissiondate: new Date().toISOString()
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
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('An error occurred while submitting your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-primary border border-black rounded-lg p-3">
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-2">Submit Information</h2>
        <p className="text-black mb-4">
          Use this form to submit corrections, new information, or report issues with the site.
        </p>

        {submitSuccess ? (
          <div className="bg-green-600/20 border border-green-500/50 text-green-800 p-4 rounded-md mb-6">
            <p className="font-medium">Thank you for your submission!</p>
            <p className="text-sm mt-1">We have received your information and will review it soon.</p>
            <button
              onClick={() => setSubmitSuccess(false)}
              className="mt-3 px-4 py-2 bg-[#f9ae37] hover:bg-[#e29d26] text-black font-medium rounded-md transition-colors border border-black"
            >
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="bg-red-600/20 border border-red-500/50 text-red-800 p-4 rounded-md">
                <p>{submitError}</p>
              </div>
            )}

            <div>
              <label htmlFor="submissionType" className="block text-sm font-semibold text-black mb-1">
                Submission Type <span className="text-red-600">*</span>
              </label>
              <select
                id="submissionType"
                name="submissionType"
                value={formData.submissionType}
                onChange={handleChange}
                required
                className="w-full px-2 py-2 bg-canvas border border-black rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
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
              <label htmlFor="contactEmail" className="block text-sm font-semibold text-black mb-1">
                Contact Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-canvas border border-black rounded-md text-black placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                placeholder="ted@dripfield.pro"
              />
            </div>

            <div>
              <label htmlFor="details" className="block text-sm font-semibold text-black mb-1">
                Details <span className="text-red-600">*</span>
              </label>
              <textarea
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-3 py-2 bg-canvas border border-black rounded-md text-black placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                placeholder="Please provide as much detail as possible about your submission..."
              />
            </div>

            <div>
              <label htmlFor="confirmationCode" className="block text-sm font-semibold text-black mb-1">
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
                  className={`px-3 py-2 bg-canvas border ${confirmationError ? 'border-red-600' : 'border-black'} rounded-md text-black placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-[#a9682e] w-24 text-sm`}
                  placeholder="&mdash;"
                />
                <span className={`ml-3 text-sm ${confirmationError ? 'text-red-600' : 'text-black/70'}`}>
                  {confirmationError ? 'Incorrect code. Please enter 726.' : 'Type the number 726 here.'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-[#f9ae37] hover:bg-[#e29d26] text-black font-medium rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none border border-black"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}