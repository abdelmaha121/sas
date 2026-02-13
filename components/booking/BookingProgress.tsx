'use client';

import { Check } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  nameAr: string;
}

interface BookingProgressProps {
  steps: Step[];
  currentStep: number;
  language: 'ar' | 'en';
}

export default function BookingProgress({ steps, currentStep, language }: BookingProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white scale-110'
                    : currentStep === step.id
                    ? 'bg-primary text-white scale-110 ring-4 ring-primary/20'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <span className="text-xs mt-2 text-center hidden md:block font-medium">
                {language === 'ar' ? step.nameAr : step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
