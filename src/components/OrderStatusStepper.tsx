
"use client";

import { cn } from "@/lib/utils";
import type { Order } from "@/types";
import { Package, Truck, CheckCircle, Undo2, ShoppingBag } from "lucide-react";

interface OrderStatusStepperProps {
  currentStatus: Order['status'];
}

const steps = [
  { status: 'pending', label: 'Order Pending', icon: Package },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const returnSteps = [
    { status: 'delivered', label: 'Delivered', icon: CheckCircle },
    { status: 'return-requested', label: 'Return Requested', icon: Undo2 },
    { status: 'return-approved', label: 'Return Approved', icon: CheckCircle },
    { status: 'returned', label: 'Returned', icon: ShoppingBag },
]

const getStepIndex = (status: Order['status']) => {
    switch (status) {
        case 'pending': return 0;
        case 'processing': return 1;
        case 'shipped': return 2;
        case 'delivered': return 3;
        case 'cancelled': return -1;
        case 'return-requested': return 1;
        case 'return-approved': return 2;
        case 'returned': return 3;
        default: return 0;
    }
}

export default function OrderStatusStepper({ currentStatus }: OrderStatusStepperProps) {
  const isReturnFlow = ['return-requested', 'return-approved', 'returned'].includes(currentStatus);
  const activeSteps = isReturnFlow ? returnSteps : steps;
  const currentStepIndex = getStepIndex(currentStatus);
  
  if (currentStatus === 'cancelled') {
      return (
          <div className="flex justify-center items-center p-4 bg-destructive/10 rounded-lg">
              <h3 className="text-destructive font-semibold text-lg capitalize">{currentStatus}</h3>
          </div>
      )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted">
            <div className="absolute left-0 top-0 h-full bg-primary transition-all duration-500" style={{ width: `${(currentStepIndex / (activeSteps.length - 1)) * 100}%` }} />
        </div>
        
        {activeSteps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const Icon = step.icon;
          return (
            <div key={step.status} className="z-10 flex flex-col items-center">
              <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500",
                  isActive ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-gray-300 text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <p className={cn(
                  "text-xs mt-2 text-center",
                  isActive ? "font-semibold text-primary" : "text-muted-foreground"
              )}>
                  {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
