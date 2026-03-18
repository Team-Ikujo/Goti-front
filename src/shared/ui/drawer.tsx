import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

type DrawerContextValue = {
   open: boolean;
   setOpen: (nextOpen: boolean) => void;
};

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

function useDrawerContext() {
   const context = React.useContext(DrawerContext);

   if (!context) {
      throw new Error('Drawer components must be used within Drawer.');
   }

   return context;
}

function Drawer({
   open: openProp,
   defaultOpen = false,
   onOpenChange,
   children,
   ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
   const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
   const isControlled = openProp !== undefined;
   const open = isControlled ? openProp : uncontrolledOpen;

   const setOpen = React.useCallback(
      (nextOpen: boolean) => {
         if (!isControlled) {
            setUncontrolledOpen(nextOpen);
         }

         onOpenChange?.(nextOpen);
      },
      [isControlled, onOpenChange],
   );

   return (
      <DrawerContext.Provider value={{ open, setOpen }}>
         <DialogPrimitive.Root open={open} onOpenChange={setOpen} {...props}>
            {children}
         </DialogPrimitive.Root>
      </DrawerContext.Provider>
   );
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
   return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
   return <DialogPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
   return <DialogPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
   return (
      <DialogPrimitive.Overlay
         data-slot="drawer-overlay"
         className={cn(
            'fixed inset-0 z-50 bg-black/28 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            className,
         )}
         {...props}
      />
   );
}

function DrawerContent({
   className,
   children,
   showOverlay = true,
   showHandle = true,
   overlayClassName,
   resizable = false,
   defaultHeight = 320,
   minHeight = 180,
   maxHeight = 560,
   ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
   showOverlay?: boolean;
   showHandle?: boolean;
   overlayClassName?: string;
   resizable?: boolean;
   defaultHeight?: number;
   minHeight?: number;
   maxHeight?: number;
}) {
   const { open, setOpen } = useDrawerContext();
   const touchStartYRef = React.useRef<number | null>(null);
   const [swipeOffset, setSwipeOffset] = React.useState(0);
   const resizeStartRef = React.useRef<{ pointerId: number; clientY: number; height: number } | null>(null);
   const [viewportHeight, setViewportHeight] = React.useState(() => (typeof window === 'undefined' ? 0 : window.innerHeight));
   const resolvedMaxHeight = viewportHeight > 0 ? Math.min(maxHeight, viewportHeight - 32) : maxHeight;
   const clampedMinHeight = Math.min(minHeight, resolvedMaxHeight);
   const clampHeight = React.useCallback(
      (nextHeight: number) => Math.min(resolvedMaxHeight, Math.max(clampedMinHeight, nextHeight)),
      [clampedMinHeight, resolvedMaxHeight],
   );
   const [currentHeight, setCurrentHeight] = React.useState(() => clampHeight(defaultHeight));

   React.useEffect(() => {
      const handleResize = () => {
         setViewportHeight(window.innerHeight);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
         window.removeEventListener('resize', handleResize);
      };
   }, []);

   React.useEffect(() => {
      setCurrentHeight((prevHeight) => clampHeight(open ? defaultHeight : prevHeight));
   }, [clampHeight, defaultHeight, open]);

   return (
      <DrawerPortal>
         {showOverlay ? <DrawerOverlay className={overlayClassName} /> : null}
         <DialogPrimitive.Content
            data-slot="drawer-content"
            className={cn(
               'fixed inset-x-0 bottom-0 z-50 mt-24 rounded-t-[16px] border border-border-light bg-elevated shadow-[0_-6px_24px_rgba(0,0,0,0.16)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full',
               className,
            )}
            style={{
               height: resizable ? `${currentHeight}px` : undefined,
               maxHeight: resizable ? `${resolvedMaxHeight}px` : undefined,
               transform: swipeOffset > 0 ? `translateY(${swipeOffset}px)` : undefined,
               transition: swipeOffset > 0 ? 'none' : undefined,
            }}
            onTouchStart={(event) => {
               if (resizable) {
                  props.onTouchStart?.(event);
                  return;
               }

               touchStartYRef.current = event.touches[0]?.clientY ?? null;
               props.onTouchStart?.(event);
            }}
            onTouchMove={(event) => {
               if (resizable) {
                  props.onTouchMove?.(event);
                  return;
               }

               if (touchStartYRef.current === null) {
                  props.onTouchMove?.(event);
                  return;
               }

               const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
               setSwipeOffset(Math.max(0, currentY - touchStartYRef.current));
               props.onTouchMove?.(event);
            }}
            onTouchEnd={(event) => {
               if (resizable) {
                  props.onTouchEnd?.(event);
                  return;
               }

               if (swipeOffset > 84) {
                  setOpen(false);
               }

               touchStartYRef.current = null;
               setSwipeOffset(0);
               props.onTouchEnd?.(event);
            }}
            {...props}
         >
            {showHandle ? (
               <div
                  className={cn('flex justify-center pt-[10px]', resizable ? 'touch-none cursor-row-resize' : '')}
                  aria-hidden="true"
                  onPointerDown={(event) => {
                     if (!resizable) {
                        return;
                     }

                     resizeStartRef.current = {
                        pointerId: event.pointerId,
                        clientY: event.clientY,
                        height: currentHeight,
                     };
                     event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                     if (!resizable || !resizeStartRef.current || resizeStartRef.current.pointerId !== event.pointerId) {
                        return;
                     }

                     const deltaY = resizeStartRef.current.clientY - event.clientY;
                     setCurrentHeight(clampHeight(resizeStartRef.current.height + deltaY));
                  }}
                  onPointerUp={(event) => {
                     if (!resizable || !resizeStartRef.current || resizeStartRef.current.pointerId !== event.pointerId) {
                        return;
                     }

                     const dragDistance = event.clientY - resizeStartRef.current.clientY;
                     const isNearMinimum = currentHeight <= clampedMinHeight + 24;

                     if (dragDistance > 80 && isNearMinimum) {
                        setOpen(false);
                     }

                     resizeStartRef.current = null;
                     if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId);
                     }
                  }}
                  onPointerCancel={(event) => {
                     if (!resizable) {
                        return;
                     }

                     resizeStartRef.current = null;
                     if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId);
                     }
                  }}
               >
                  <div className="h-1 w-9 rounded-full bg-border-light" />
               </div>
            ) : null}
            {children}
         </DialogPrimitive.Content>
      </DrawerPortal>
   );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
   return <div data-slot="drawer-header" className={cn('flex flex-col p-5', className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
   return <div data-slot="drawer-footer" className={cn('p-5 pt-0', className)} {...props} />;
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
   return <DialogPrimitive.Title data-slot="drawer-title" className={cn('text-heading-3-bold text-foreground', className)} {...props} />;
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
   return (
      <DialogPrimitive.Description
         data-slot="drawer-description"
         className={cn('text-body-2-regular text-muted-foreground', className)}
         {...props}
      />
   );
}

export {
   Drawer,
   DrawerClose,
   DrawerContent,
   DrawerDescription,
   DrawerFooter,
   DrawerHeader,
   DrawerOverlay,
   DrawerPortal,
   DrawerTitle,
   DrawerTrigger,
};
