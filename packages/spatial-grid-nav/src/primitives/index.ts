// Utilities
export { cn } from "./utils/cn.ts";
export { Portal, type PortalProps } from "./utils/portal.tsx";
export { useControllable } from "./utils/use-controllable.ts";
export {
  useAnchorPosition,
  type UseAnchorPositionOptions,
  type AnchorPositionResult,
} from "./utils/use-anchor-position.ts";
export { useFocusTrap } from "./utils/use-focus-trap.ts";
export { useScrollLock } from "./utils/use-scroll-lock.ts";
export { useOutsideClick } from "./utils/use-outside-click.ts";
export { useTypeahead } from "./utils/use-typeahead.ts";

// Phase 1: Pure Components
export {
  Button,
  buttonVariants,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./button.tsx";
export {
  Badge,
  badgeVariants,
  type BadgeProps,
  type BadgeVariant,
} from "./badge.tsx";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./card.tsx";
export { Label } from "./label.tsx";
export { Separator, type SeparatorProps } from "./separator.tsx";
export { Skeleton } from "./skeleton.tsx";
export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
  type FieldOrientation,
} from "./field.tsx";
export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
  type InputGroupAddonAlign,
  type InputGroupButtonSize,
} from "./input-group.tsx";

// Phase 2: Interactive Components
export { Input } from "./input.tsx";
export { Textarea } from "./textarea.tsx";
export { Switch, type SwitchProps } from "./switch.tsx";
export {
  Toggle,
  toggleVariants,
  type ToggleProps,
  type ToggleVariant,
  type ToggleSize,
} from "./toggle.tsx";
export { Slider, type SliderProps } from "./slider.tsx";

// Phase 3: Medium Complexity Components
export { ScrollArea, ScrollBar, type ScrollAreaProps } from "./scroll-area.tsx";
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  type CollapsibleProps,
} from "./collapsible.tsx";
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  type TabsProps,
  type TabsListProps,
  type TabsListVariant,
  type TabsTriggerProps,
  type TabsContentProps,
} from "./tabs.tsx";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  type TooltipProps,
  type TooltipProviderProps,
  type TooltipTriggerProps,
  type TooltipContentProps,
} from "./tooltip.tsx";

// Phase 4: Complex Components
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
  type DialogTriggerProps,
  type DialogContentProps,
} from "./dialog.tsx";
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogProps,
  type AlertDialogContentProps,
} from "./alert-dialog.tsx";
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  type SheetProps,
  type SheetContentProps,
  type SheetSide,
} from "./sheet.tsx";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectProps,
  type SelectTriggerProps,
  type SelectContentProps,
  type SelectItemProps,
} from "./select.tsx";
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  type DropdownMenuProps,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
} from "./dropdown-menu.tsx";
export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
  type ComboboxProps,
  type ComboboxInputProps,
  type ComboboxContentProps,
  type ComboboxItemProps,
} from "./combobox.tsx";
