
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ShippingAddress } from '@/types';
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Home, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

type AddressFormInputs = Omit<ShippingAddress, 'id' | 'default'>;

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressFormInputs) => void;
  address: ShippingAddress | null;
}

export default function AddressFormModal({ isOpen, onClose, onSave, address }: AddressFormModalProps) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AddressFormInputs>({
    defaultValues: {
      type: 'Home',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (address) {
        reset(address);
      } else {
        reset({
          type: 'Home',
          fullName: '',
          phone: '',
          address: '',
          city: '',
          area: '',
        });
      }
    }
  }, [address, isOpen, reset]);

  const onSubmit: SubmitHandler<AddressFormInputs> = data => {
    onSave(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          <DialogDescription>
            Enter your shipping details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
           <div className="space-y-1.5">
            <Label className="text-xs">Address Type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 gap-2"
                >
                  <div>
                    <RadioGroupItem value="Home" id="home" className="peer sr-only" />
                    <Label
                      htmlFor="home"
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      )}
                    >
                      <Home className="mb-2 h-5 w-5" />
                      Home
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="Office" id="office" className="peer sr-only" />
                    <Label
                      htmlFor="office"
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      )}
                    >
                      <Building className="mb-2 h-5 w-5" />
                      Office
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs">Full Name</Label>
            <Input id="fullName" {...register("fullName", { required: "Full name is required" })} />
            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs">Phone</Label>
            <Input id="phone" {...register("phone", { required: "Phone number is required" })} />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
          </div>
           <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs">Address</Label>
            <Input id="address" {...register("address", { required: "Address is required" })} />
            {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area" className="text-xs">Area</Label>
            <Input id="area" {...register("area", { required: "Area is required" })} />
            {errors.area && <p className="text-red-500 text-xs">{errors.area.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs">City</Label>
            <Input id="city" {...register("city", { required: "City is required" })} />
            {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm">Save Address</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
