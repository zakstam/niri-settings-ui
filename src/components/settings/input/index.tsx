import { Tabs, TabsContent, TabsList, TabsTrigger } from "spatial-grid-nav/primitives";
import { PageHeader } from "spatial-grid-nav/layouts";
import { NavigationGroup } from "spatial-grid-nav/react";
import { KeyboardSettings } from "./keyboard-settings";
import { TouchpadSettings } from "./touchpad-settings";
import { MouseSettings } from "./mouse-settings";
import { TrackpointSettings } from "./trackpoint-settings";
import { FocusSettings } from "./focus-settings";
import { TrackballSettings } from "./trackball-settings";
import { TabletSettings } from "./tablet-settings";
import { TouchSettings } from "./touch-settings";
import {
  IconKeyboard,
  IconHandFinger,
  IconMouse,
  IconCircleDot,
  IconFocus2,
  IconDeviceTablet,
  IconBallBowling,
  IconHandClick,
} from "@tabler/icons-react";

export function InputSection() {
  return (
    <div>
      <PageHeader
        title="Input"
        description="Configure keyboard, touchpad, mouse, trackpoint, and focus behavior"
      />
      <Tabs defaultValue="keyboard">
        <NavigationGroup
          orientation="horizontal"
          className="rounded-xl border border-border bg-card transition-all duration-200 relative p-2"
        >
          <TabsList
            variant="line"
            className="gap-0.5"
          >
            <TabsTrigger value="keyboard">
              <IconKeyboard size={16} />
              Keyboard
            </TabsTrigger>
            <TabsTrigger value="touchpad">
              <IconHandFinger size={16} />
              Touchpad
            </TabsTrigger>
            <TabsTrigger value="mouse">
              <IconMouse size={16} />
              Mouse
            </TabsTrigger>
            <TabsTrigger value="trackpoint">
              <IconCircleDot size={16} />
              Trackpoint
            </TabsTrigger>
            <TabsTrigger value="focus">
              <IconFocus2 size={16} />
              Focus
            </TabsTrigger>
            <TabsTrigger value="trackball">
              <IconBallBowling size={16} />
              Trackball
            </TabsTrigger>
            <TabsTrigger value="tablet">
              <IconDeviceTablet size={16} />
              Tablet
            </TabsTrigger>
            <TabsTrigger value="touch">
              <IconHandClick size={16} />
              Touch
            </TabsTrigger>
          </TabsList>
        </NavigationGroup>

        <TabsContent value="keyboard">
          <KeyboardSettings />
        </TabsContent>
        <TabsContent value="touchpad">
          <TouchpadSettings />
        </TabsContent>
        <TabsContent value="mouse">
          <MouseSettings />
        </TabsContent>
        <TabsContent value="trackpoint">
          <TrackpointSettings />
        </TabsContent>
        <TabsContent value="focus">
          <FocusSettings />
        </TabsContent>
        <TabsContent value="trackball">
          <TrackballSettings />
        </TabsContent>
        <TabsContent value="tablet">
          <TabletSettings />
        </TabsContent>
        <TabsContent value="touch">
          <TouchSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
