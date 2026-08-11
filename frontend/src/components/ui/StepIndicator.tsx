export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { number: 1, label: 'Connect' },
    { number: 2, label: 'Verify' },
    { number: 3, label: 'Profile' },
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = step.number === current;
        const isCompleted = step.number < current;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.number} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.number}
              </div>
              <span className="mt-1 text-xs text-muted-foreground">{step.label}</span>
            </div>
            {!isLast && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  step.number < current ? 'bg-emerald-500/40' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
