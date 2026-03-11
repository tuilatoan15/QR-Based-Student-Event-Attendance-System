import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { QrReader } from 'react-qr-reader';
import { attendanceApi } from '../api/attendanceApi';

const QRScannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const eventId = searchParams.get('eventId');

  const handleScan = async (data: string | null) => {
    if (!data || processing) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await attendanceApi.checkIn(data);
      const msg =
        res.data?.message ||
        res.data?.data?.message ||
        'Check-in successful';
      setLastResult(msg);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Check-in failed. Please try again or verify the QR code.',
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">QR Scanner</h2>
      {eventId && (
        <p className="text-sm text-slate-600">
          Scanning for event ID: <span className="font-semibold">{eventId}</span>
        </p>
      )}
      <div className="max-w-md rounded-lg bg-white p-4 shadow">
        <QrReader
          constraints={{ facingMode: 'environment' }}
          onResult={(result, err) => {
            if (!!result) {
              void handleScan(result.getText());
            } else if (err) {
              // ignore continuous errors to avoid noise
            }
          }}
          containerStyle={{ width: '100%' }}
        />
      </div>
      {processing && <div>Processing...</div>}
      {lastResult && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {lastResult}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default QRScannerPage;

