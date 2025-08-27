
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShippingAddress } from '@/types';
import { useForm, SubmitHandler } from "react-hook-form";

type AddressFormInputs = Omit<ShippingAddress, 'id' | 'default'>;

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressFormInputs) => void;
  address: ShippingAddress | null;
}

export default function AddressFormModal({ isOpen, onClose, onSave, address }: AddressFormModalProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddressFormInputs>();

  useEffect(() => {
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
  }, [address, isOpen, reset]);

  const onSubmit: SubmitHandler<AddressFormInputs> = data => {
    onSave(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          <DialogDescription>
            Enter your shipping details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">
              Full Name
            </Label>
            <Input id="fullName" {...register("fullName", { required: "Full name is required" })} className="col-span-3" />
            {errors.fullName && <p className="col-span-4 text-right text-red-500 text-xs">{errors.fullName.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input id="phone" {...register("phone", { required: "Phone number is required" })} className="col-span-3" />
            {errors.phone && <p className="col-span-4 text-right text-red-500 text-xs">{errors.phone.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
             <Select onValueChange={(value: 'Home' | 'Office') => setValue('type', value)} defaultValue={address?.type || 'Home'}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select address type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Input id="address" {...register("address", { required: "Address is required" })} className="col-span-3" />
            {errors.address && <p className="col-span-4 text-right text-red-500 text-xs">{errors.address.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="area" className="text-right">
              Area
            </Label>
            <Input id="area" {...register("area", { required: "Area is required" })} className="col-span-3" />
            {errors.area && <p className="col-span-4 text-right text-red-500 text-xs">{errors.area.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              City
            </Label>
            <Input id="city" {...register("city", { required: "City is required" })} className="col-span-3" />
            {errors.city && <p className="col-span-4 text-right text-red-500 text-xs">{errors.city.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Address</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
