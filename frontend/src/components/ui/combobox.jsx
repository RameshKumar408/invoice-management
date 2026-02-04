"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({
    options = [],
    value,
    onValueChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No option found.",
    className
}) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const selectedOption = options.find((option) => option.value === value)

    return (
        <Popover open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) setSearchQuery("")
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
                sideOffset={4}
            >
                <div className="flex flex-col h-full max-h-[300px]">
                    <div className="flex items-center border-b px-3 py-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-9 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            <div className="p-1">
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                            value === option.value && "bg-accent/50"
                                        )}
                                        onClick={() => {
                                            onValueChange(option.value)
                                            setOpen(false)
                                            setSearchQuery("")
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate">{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
