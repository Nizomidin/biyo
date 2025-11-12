import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";
import { useNavigate, useLocation } from "react-router-dom";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  target: string; // CSS selector or data attribute
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void;
  waitForElement?: boolean;
  skipIf?: () => boolean;
}

export function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const guideShown = localStorage.getItem('onboarding-tour-shown');
    const currentUser = store.getCurrentUser();
    
    if (!guideShown && currentUser) {
      const loginTime = sessionStorage.getItem('user-login-time');
      const now = Date.now();
      
      if (!loginTime || (now - parseInt(loginTime)) < 5000) {
        // Wait a bit for page to render
        setTimeout(() => {
          setIsActive(true);
        }, 1000);
      }
    }
  }, [location.pathname]);

  const steps: TourStep[] = [
    {
      id: "create-doctor",
      target: '[data-tour="add-doctor"]',
      title: "Создание врача",
      description: "Нажмите здесь, чтобы добавить первого врача в систему",
      position: "bottom",
      waitForElement: true,
      skipIf: () => {
        const doctors = store.getDoctors();
        return doctors.length > 0;
      }
    },
    {
      id: "create-appointment",
      target: '[data-tour="calendar-slot"]',
      title: "Создание записи",
      description: "Нажмите на любое свободное время в календаре, чтобы создать запись на прием",
      position: "top",
      waitForElement: true,
      action: () => {
        navigate("/");
      }
    },
    {
      id: "create-patient",
      target: '[data-tour="add-patient"]',
      title: "Создание пациента",
      description: "Нажмите эту кнопку, чтобы добавить нового пациента",
      position: "bottom",
      waitForElement: true,
      action: () => {
        navigate("/patients");
      }
    },
    {
      id: "edit-patient",
      target: '[data-tour="patient-card"]',
      title: "Редактирование карточки пациента",
      description: "Нажмите на карточку пациента, чтобы открыть и редактировать информацию",
      position: "top",
      waitForElement: true,
      action: () => {
        navigate("/patients");
      }
    },
    {
      id: "analytics",
      target: '[data-tour="analytics-tab"]',
      title: "Просмотр аналитики",
      description: "Нажмите на эту вкладку, чтобы перейти к аналитике и статистике",
      position: "bottom",
      waitForElement: true,
      action: () => {
        navigate("/analytics");
      }
    }
  ];

  const filteredSteps = steps.filter(step => !step.skipIf || !step.skipIf());
  const currentStepData = filteredSteps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const findAndHighlightElement = () => {
      // If action is needed, execute it first
      if (currentStepData.action) {
        currentStepData.action();
        // Wait for navigation/rendering
        setTimeout(() => {
          highlightElement();
        }, 500);
      } else {
        highlightElement();
      }
    };

    const highlightElement = () => {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      
      if (element) {
        setHighlightedElement(element);
        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        // Calculate tooltip position based on step position
        let top = rect.top + scrollY;
        let left = rect.left + scrollX;

        switch (currentStepData.position) {
          case "top":
            top = rect.top + scrollY - 10;
            left = rect.left + scrollX + rect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + scrollY + 10;
            left = rect.left + scrollX + rect.width / 2;
            break;
          case "left":
            top = rect.top + scrollY + rect.height / 2;
            left = rect.left + scrollX - 10;
            break;
          case "right":
            top = rect.top + scrollY + rect.height / 2;
            left = rect.right + scrollX + 10;
            break;
        }

        setTooltipPosition({ top, left });

        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (currentStepData.waitForElement) {
        // Retry after a short delay if element not found
        setTimeout(findAndHighlightElement, 500);
      }
    };

    findAndHighlightElement();
  }, [isActive, currentStep, currentStepData, location.pathname]);

  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setHighlightedElement(null);
      setTooltipPosition(null);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setHighlightedElement(null);
      setTooltipPosition(null);
    }
  };

  const handleFinish = () => {
    setIsActive(false);
    setHighlightedElement(null);
    setTooltipPosition(null);
    localStorage.setItem('onboarding-tour-shown', 'true');
  };

  const handleSkip = () => {
    handleFinish();
  };

  if (!isActive || !currentStepData) return null;

  const elementRect = highlightedElement?.getBoundingClientRect();

  return (
    <>
      {/* Overlay with hole for highlighted element */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          background: elementRect
            ? `radial-gradient(circle at ${elementRect.left + elementRect.width / 2}px ${elementRect.top + elementRect.height / 2}px, transparent ${Math.max(elementRect.width, elementRect.height) / 2 + 5}px, rgba(0, 0, 0, 0.7) ${Math.max(elementRect.width, elementRect.height) / 2 + 10}px)`
            : "rgba(0, 0, 0, 0.7)",
        }}
      />

      {/* Highlighted element border */}
      {highlightedElement && elementRect && (
        <div
          className="fixed z-[9999] pointer-events-none border-4 border-blue-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            top: elementRect.top - 4,
            left: elementRect.left - 4,
            width: elementRect.width + 8,
            height: elementRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPosition && currentStepData && (
        <div
          className="fixed z-[10000] pointer-events-auto"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: "translate(-50%, 0)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm border border-gray-200 dark:border-gray-700">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {filteredSteps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === currentStep
                        ? "bg-blue-600 w-6"
                        : index < currentStep
                        ? "bg-blue-300 w-1.5"
                        : "bg-gray-300 w-1.5"
                    )}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {currentStepData.description}
            </p>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                size="sm"
              >
                Пропустить
              </Button>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                {currentStep < filteredSteps.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    size="sm"
                  >
                    Далее
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinish}
                    size="sm"
                  >
                    Завершить
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Arrow pointing to element */}
          {elementRect && (
            <div
              className={cn(
                "absolute w-0 h-0 border-8 border-transparent",
                currentStepData.position === "bottom" && "border-b-white dark:border-b-gray-800 -top-2 left-1/2 -translate-x-1/2",
                currentStepData.position === "top" && "border-t-white dark:border-t-gray-800 -bottom-2 left-1/2 -translate-x-1/2",
                currentStepData.position === "left" && "border-l-white dark:border-l-gray-800 -right-2 top-1/2 -translate-y-1/2",
                currentStepData.position === "right" && "border-r-white dark:border-r-gray-800 -left-2 top-1/2 -translate-y-1/2"
              )}
            />
          )}
        </div>
      )}
    </>
  );
}

