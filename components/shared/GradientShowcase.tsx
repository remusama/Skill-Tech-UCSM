"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ThemeGradientBackground,
  ThemeGradientText,
  ThemeGradientBorder,
  ThemeGradientButton,
  AnimatedGradient,
  AnimatedGradientBorder,
} from "@/components/shared/ThemeGradients"

const variants = ["primary", "secondary", "accent", "info", "success", "warning", "danger"]
const intensities = ["soft", "normal", "vibrant"]
const directions = ["to-r", "to-l", "to-t", "to-b", "to-tr", "to-tl", "to-br", "to-bl"]

export default function GradientShowcase() {
  const [selectedVariant, setSelectedVariant] = useState("primary")
  const [selectedIntensity, setSelectedIntensity] = useState("normal")
  const [selectedDirection, setSelectedDirection] = useState("to-r")

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">
        <ThemeGradientText>Gradient UI Components</ThemeGradientText>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-2">Variant</h2>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <ThemeGradientButton
                key={variant}
                variant={variant as any}
                className={`text-xs py-1 px-2 ${selectedVariant === variant ? "ring-2 ring-offset-2" : ""}`}
                onClick={() => setSelectedVariant(variant)}
              >
                {variant}
              </ThemeGradientButton>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-medium mb-2">Intensity</h2>
          <div className="flex flex-wrap gap-2">
            {intensities.map((intensity) => (
              <ThemeGradientButton
                key={intensity}
                intensity={intensity as any}
                variant={selectedVariant as any}
                className={`text-xs py-1 px-2 ${selectedIntensity === intensity ? "ring-2 ring-offset-2" : ""}`}
                onClick={() => setSelectedIntensity(intensity)}
              >
                {intensity}
              </ThemeGradientButton>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-medium mb-2">Direction</h2>
          <div className="flex flex-wrap gap-2">
            {directions.map((direction) => (
              <ThemeGradientButton
                key={direction}
                direction={direction as any}
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                className={`text-xs py-1 px-2 ${selectedDirection === direction ? "ring-2 ring-offset-2" : ""}`}
                onClick={() => setSelectedDirection(direction)}
              >
                {direction}
              </ThemeGradientButton>
            ))}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="backgrounds" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="borders">Borders</TabsTrigger>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="animated">Animated</TabsTrigger>
        </TabsList>

        <TabsContent value="backgrounds">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Standard Background</h2>
              <ThemeGradientBackground
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                direction={selectedDirection as any}
                className="p-6 rounded-lg"
              >
                <p className="text-white font-medium">
                  This is a gradient background with {selectedVariant} variant, {selectedIntensity} intensity, and{" "}
                  {selectedDirection} direction.
                </p>
              </ThemeGradientBackground>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Hover Effect</h2>
              <ThemeGradientBackground
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                direction={selectedDirection as any}
                hover={true}
                className="p-6 rounded-lg"
              >
                <p className="text-white font-medium">Hover over me to see the gradient reverse!</p>
              </ThemeGradientBackground>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Gradient Text</h2>
              <p className="text-2xl font-bold">
                <ThemeGradientText
                  variant={selectedVariant as any}
                  intensity={selectedIntensity as any}
                  direction={selectedDirection as any}
                >
                  This text has a beautiful gradient applied to it
                </ThemeGradientText>
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Hover Effect</h2>
              <p className="text-2xl font-bold">
                <ThemeGradientText
                  variant={selectedVariant as any}
                  intensity={selectedIntensity as any}
                  direction={selectedDirection as any}
                  hover={true}
                >
                  Hover over this text to see the gradient change
                </ThemeGradientText>
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="borders">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Gradient Border</h2>
              <ThemeGradientBorder
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                direction={selectedDirection as any}
                className="p-6"
              >
                <p>This content has a gradient border applied to it</p>
              </ThemeGradientBorder>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Hover Effect</h2>
              <ThemeGradientBorder
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                direction={selectedDirection as any}
                hover={true}
                className="p-6"
              >
                <p>Hover over me to see the border gradient change</p>
              </ThemeGradientBorder>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="buttons">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 flex flex-col items-center">
              <h2 className="text-lg font-medium mb-4">Standard Button</h2>
              <ThemeGradientButton
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                direction={selectedDirection as any}
              >
                Gradient Button
              </ThemeGradientButton>
            </Card>

            <Card className="p-6 flex flex-col items-center">
              <h2 className="text-lg font-medium mb-4">Animated Button</h2>
              <ThemeGradientButton
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                direction={selectedDirection as any}
                animated={true}
              >
                Animated Button
              </ThemeGradientButton>
            </Card>

            <Card className="p-6 flex flex-col items-center">
              <h2 className="text-lg font-medium mb-4">Large Button</h2>
              <ThemeGradientButton
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                direction={selectedDirection as any}
                className="text-lg py-3 px-6"
              >
                Large Button
              </ThemeGradientButton>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="animated">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Animated Gradient</h2>
              <AnimatedGradient
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                className="p-6 rounded-lg"
              >
                <p className="text-white font-medium">This gradient animates smoothly between colors</p>
              </AnimatedGradient>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Animated Border</h2>
              <AnimatedGradientBorder
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                className="p-6"
              >
                <p>This content has an animated gradient border</p>
              </AnimatedGradientBorder>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Fast Animation</h2>
              <AnimatedGradient
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                speed="fast"
                className="p-6 rounded-lg"
              >
                <p className="text-white font-medium">This gradient animates quickly</p>
              </AnimatedGradient>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Slow Animation</h2>
              <AnimatedGradient
                variant={selectedVariant as any}
                intensity={selectedIntensity as any}
                speed="slow"
                className="p-6 rounded-lg"
              >
                <p className="text-white font-medium">This gradient animates slowly</p>
              </AnimatedGradient>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">
          <ThemeGradientText>How to Use</ThemeGradientText>
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Background Example:</h3>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              {`<ThemeGradientBackground
  variant="${selectedVariant}"
  intensity="${selectedIntensity}"
  direction="${selectedDirection}"
  className="p-4 rounded-lg"
>
  Your content here
</ThemeGradientBackground>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">Text Example:</h3>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              {`<ThemeGradientText
  variant="${selectedVariant}"
  intensity="${selectedIntensity}"
  direction="${selectedDirection}"
>
  Your text here
</ThemeGradientText>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">Button Example:</h3>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              {`<ThemeGradientButton
  variant="${selectedVariant}"
  intensity="${selectedIntensity}"
  direction="${selectedDirection}"
  onClick={() => alert('Clicked!')}
>
  Click Me
</ThemeGradientButton>`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}
