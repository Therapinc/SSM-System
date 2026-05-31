import React, { useEffect, useState } from "react";

const CONFIRMATION_TEXT = "confirm";

const DeleteConfirmationModal = ({
  open,
  title,
  entityName,
  entityType,
  onCancel,
  onConfirm,
}) => {
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmationText("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const isConfirmEnabled = confirmationText === CONFIRMATION_TEXT;
  const resolvedEntityType = entityType || "record";

  const handleConfirm = () => {
    if (!isConfirmEnabled) {
      return;
    }

    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#fff6ef] to-[#fffaf6] px-6 py-5">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E38B52]/15 text-[#C8742F]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[#170F49]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#6F6C8F]">
            Are you sure you want to delete <span className="font-semibold text-[#170F49]">{entityName}</span>?
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6F6C8F]">This action cannot be undone.</p>
        </div>

        <div className="px-6 py-6">
          <label htmlFor="delete-confirmation-input" className="block text-sm text-[#170F49]">
            Type <span className="font-bold">confirm</span> below to permanently delete this {resolvedEntityType}.
          </label>
          <input
            id="delete-confirmation-input"
            type="text"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder="confirm"
            autoComplete="off"
            spellCheck={false}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[#170F49] outline-none transition focus:border-[#E38B52] focus:bg-white focus:ring-4 focus:ring-[#E38B52]/15"
          />

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#170F49] transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isConfirmEnabled}
              className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                isConfirmEnabled
                  ? "bg-[#D64545] hover:bg-[#b93636]"
                  : "cursor-not-allowed bg-[#D64545]/45"
              }`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;