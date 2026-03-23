import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

export type StyledSelectOption = {
  value: string;
  label: string;
};

type StyledSelectFieldProps = {
  value?: string;
  onValueChange: (value: string) => void;
  options: StyledSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
};

const MOBILE_BREAKPOINT = 640;

export function StyledSelectField({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  disabled,
  triggerClassName,
  contentClassName,
}: StyledSelectFieldProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const mobileTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handleChange = () => setIsMobile(mediaQuery.matches);

    handleChange();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const selectedOption = options.find((option) => option.value === value);
  const fieldLabel = ariaLabel ?? placeholder ?? 'Select option';
  const triggerClasses = cn(
    'input-surface h-auto min-h-[56px] w-full rounded-[22px] border border-[#e7d9c8]/90 bg-white/86 px-4 py-3.5 text-left text-sm font-medium text-[#1f2330] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition-all hover:bg-white/92 focus-visible:border-[#b84f45]/40 focus-visible:ring-4 focus-visible:ring-[#b84f45]/10 data-[placeholder]:text-[#8f8275] [&>span]:text-left',
    triggerClassName,
  );

  if (isMobile) {
    return (
      <>
        <button
          ref={mobileTriggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          aria-label={fieldLabel}
          disabled={disabled}
          onClick={(event) => {
            event.currentTarget.blur();
            setMobileOpen(true);
          }}
          className={cn(
            triggerClasses,
            'flex items-center justify-between gap-3 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <span className={selectedOption ? 'text-[#1f2330]' : 'text-[#8f8275]'}>
            {selectedOption?.label ?? placeholder ?? 'Select option'}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#9c8f82]" />
        </button>

        <Drawer
          open={mobileOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              mobileTriggerRef.current?.blur();
            }
            setMobileOpen(nextOpen);
          }}
          direction="bottom"
        >
          <DrawerContent className="border-[#eadcca] bg-[#fffaf4] text-[#1f2330]">
            <DrawerHeader className="px-5 pb-2 pt-5 text-left">
              <DrawerTitle className="text-base font-semibold text-[#1f2330]">{fieldLabel}</DrawerTitle>
              <DrawerDescription className="sr-only">
                Choose one option for {fieldLabel.toLowerCase()}.
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[min(55svh,28rem)] overflow-y-auto px-4 pb-5">
              <div className="space-y-2">
                {options.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onValueChange(option.value);
                        setMobileOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-[20px] border px-4 py-3.5 text-left text-[0.98rem] font-medium transition-all',
                        isSelected
                          ? 'border-[#ddb4a6] bg-[#f8ede4] text-[#b84f45] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
                          : 'border-transparent bg-white/76 text-[#4b4035] hover:bg-white',
                      )}
                    >
                      <span>{option.label}</span>
                      {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Select value={value ?? ''} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label={fieldLabel}
        className={triggerClasses}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        sideOffset={8}
        className={cn(
          'z-[140] max-h-80 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[24px] border border-[#e7d9c8]/90 bg-[#fffaf4]/98 p-1.5 text-[#1f2330] shadow-[0_22px_60px_rgba(102,71,49,0.18)] backdrop-blur-xl',
          contentClassName,
        )}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="min-h-[2.75rem] rounded-[18px] px-4 py-3 text-[0.95rem] font-medium text-[#4b4035] focus:bg-[#b84f45] focus:text-white data-[state=checked]:bg-[#f7eadf] data-[state=checked]:text-[#b84f45]"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
