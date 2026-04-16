'use client';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import InspectionForm from '../components/InspectionForm';
import SubmittedView from '../components/SubmittedView';
import { getFormConfig } from '../lib/data';

export default function Home() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('form'); // 'form' | 'submitted'
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    getFormConfig()
      .then(setConfig)
      .catch(err => console.error('Failed to load config:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🚛</div>
          <p className="text-gn-navy font-bold">Loading inspection form...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md shadow-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-gn-navy font-bold mb-2">Connection Error</h2>
          <p className="text-gray-500 text-sm">
            Could not connect to the database. Check that your Supabase URL and key
            are set in the environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (view === 'submitted') {
    return (
      <SubmittedView
        data={submittedData}
        onNewInspection={() => {
          setView('form');
          setSubmittedData(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-body">
      <Header />
      <InspectionForm
        sections={config.sections}
        drivers={config.drivers}
        trucks={config.trucks}
        onSubmitted={(data) => {
          setSubmittedData(data);
          setView('submitted');
        }}
      />
    </div>
  );
}
