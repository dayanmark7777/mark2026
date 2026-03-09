import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { SRI_LANKAN_DISTRICTS } from "@/lib/constants";

interface DistrictSelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    disabled?: boolean;
    districts?: string[];
    label?: string;
    required?: boolean;
}

export function DistrictSelect({
    value,
    onValueChange,
    className = "",
    disabled = false,
    districts = SRI_LANKAN_DISTRICTS,
    label = "District",
    required = false,
}: DistrictSelectProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}{required && " *"}
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal hover:bg-background"
                        disabled={disabled}
                    >
                        {value
                            ? districts.find((district) => district === value)
                            : "Select District"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search district..." />
                        <CommandList>
                            <CommandEmpty>No district found.</CommandEmpty>
                            <CommandGroup>
                                {districts.map((district) => (
                                    <CommandItem
                                        key={district}
                                        value={district}
                                        onSelect={() => {
                                            onValueChange?.(district === value ? "" : district);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === district ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {district}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
