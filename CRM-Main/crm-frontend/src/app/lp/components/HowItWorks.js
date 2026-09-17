"use client";

import { 
  UserPlus, 
  Settings,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef(null);
  const stepRefs = useRef([]);

  const steps = [
    {
      step: '1',
      title: 'Sign Up',
      description: 'Create your free account in 2 minutes',
      icon: UserPlus,
      color: 'bg-blue-500',
      features: ['No credit card required', 'Instant access', 'Free 14-day trial']
    },
    {
      step: '2',
      title: 'Setup Business',
      description: 'Add your business details and preferences',
      icon: Settings,
      color: 'bg-purple-500',
      features: ['GST registration', 'Staff setup', 'Inventory import']
    },
    {
      step: '3',
      title: 'Start Managing',
      description: 'Begin running your business efficiently',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      features: ['Use POS system', 'Track sales', 'Monitor growth']
    }
  ];

  // Auto scroll steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Center active step
  useEffect(() => {
    if (stepRefs.current[activeStep] && containerRef.current) {
      const step = stepRefs.current[activeStep];
      const container = containerRef.current;

      container.scrollTo({
        left: step.offsetLeft - container.offsetWidth / 2 + step.offsetWidth / 2,
        behavior: 'smooth'
      });
    }
  }, [activeStep]);

  return (
    <section className="min-h-screen bg-white overflow-hidden flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full py-10 flex flex-col justify-between">

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Simple 3-Step Journey
          </h2>
          <p className="text-gray-600 text-lg">
            Watch how easily you can get started
          </p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => setActiveStep(index)}
                  className={`w-12 h-12 rounded-full font-bold flex items-center justify-center transition-all duration-300 ${
                    index === activeStep
                      ? `${step.color} text-white scale-105 shadow-lg`
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.step}
                </button>

                {index < steps.length - 1 && (
                  <div className="w-16 h-1 bg-gray-200 mx-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        index < activeStep ? step.color : 'bg-gray-200'
                      }`}
                      style={{ width: index < activeStep ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div
          ref={containerRef}
          className="flex overflow-x-auto scrollbar-hide pb-4"
        >
          {steps.map((step, index) => (
            <div
              key={index}
              ref={el => (stepRefs.current[index] = el)}
              className={`flex-shrink-0 w-full md:w-1/3 px-4 transition-opacity duration-500 ${
                index === activeStep ? 'opacity-100' : 'opacity-70'
              }`}
            >
              <div className="bg-white border rounded-xl p-6 shadow-sm h-full text-center">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    step.color
                  } ${index === activeStep ? 'animate-bounce-subtle' : ''}`}
                >
                  <step.icon className="text-white w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>

                <div className="space-y-2">
                  {step.features.map((feature, i) => (
                    <div key={i} className="flex items-center justify-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-6 mt-6">
          <button
            onClick={() => setActiveStep((p) => (p - 1 + steps.length) % steps.length)}
            className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <ChevronRight className="rotate-180" />
          </button>

          <span className="text-sm text-gray-600">
            Step {activeStep + 1} of {steps.length}
          </span>

          <button
            onClick={() => setActiveStep((p) => (p + 1) % steps.length)}
            className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <ChevronRight />
          </button>
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <Link href="/get-started">
            <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto hover:scale-105 transition">
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            Complete setup in under 10 minutes • Free trial
          </p>
        </div>

        {/* Animations */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .animate-bounce-subtle {
            animation: bounce-subtle 1s ease-in-out;
          }
        `}</style>
      </div>
    </section>
  );
}
