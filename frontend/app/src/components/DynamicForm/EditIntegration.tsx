import { update_integration } from "@/utils/api";
import React, { useState } from "react";

interface DynamicFormProps {
  data: { [key: string]: any };
  closeForm: () => void;
}

const EditIntegration: React.FC<DynamicFormProps> = ({ data, closeForm }) => {
  const [formData, setFormData] = useState(data);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === "false") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: false,
      }));
    } else if (value === "true") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: true,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, is_enabled, is_running } = formData;

    const params = {
      pipeline_id: id,
      fields: {
        is_enabled,
        is_running,
      },
    };
    await update_integration(params);
    closeForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-10"
        onClick={closeForm}
      ></div>

      {/* Sidebar */}
      <div className="animate-slide-in-right relative h-full w-96 bg-white p-6 shadow-lg dark:bg-boxdark">
        {/* Close Button */}
        <button
          onClick={closeForm}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Title */}
        <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
          Edit
        </h2>

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(formData).map(([key, value]) => {
            if (
              key !== "id" &&
              key !== "created_at" &&
              key !== "updated_at" &&
              key !== "cron_expression" &&
              key !== "integration_type"
            ) {
              return (
                <div key={key} className="flex flex-col">
                  <label
                    htmlFor={key}
                    className="text-sm font-medium capitalize text-gray-700 dark:text-white"
                  >
                    {key.replace("_", " ")}
                  </label>
                  <input
                    id={key}
                    name={key}
                    value={value}
                    onChange={handleChange}
                    className="mt-1 rounded border bg-whiten p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-boxdark"
                  />
                </div>
              );
            }
          })}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIntegration;
