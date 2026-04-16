'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog';
import OnboardingFlow from '@/features/onboarding/onboarding-flow';

interface OnboardingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl overflow-y-auto custom-scrollbar">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-3xl font-extrabold tracking-tight">Onboard your Project</DialogTitle>
                    <DialogDescription>
                        Follow the guided steps to connect your repository and launch your first CodexFlow run.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-visible">
                    <OnboardingFlow onComplete={() => onOpenChange(false)} />
                </div>

                <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: hsl(var(--border));
            border-radius: 10px;
          }
        `}</style>
            </DialogContent>
        </Dialog>
    );
}
