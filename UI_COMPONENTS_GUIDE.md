# UI Component Library Guide

Welcome to the comprehensive UI Component Library for the CristOS app. This guide provides detailed documentation for all available UI elements, design patterns, and code examples that you can copy and use throughout the application.

## 📱 Access the Interactive UI Library

Navigate to the **UI Library** page in the app to see live examples of all components. You can copy code snippets directly from the interface.

**Path:** `app/ui-library.tsx`

## 🎨 Design System

### Colors

The app uses a comprehensive color palette defined in `constants/theme.ts`:

```typescript
import { COLORS } from '../constants';

// Primary Colors
COLORS.primary        // #246bfd - Main brand color
COLORS.secondary      // #FFD300 - Secondary accent
COLORS.success        // #0ABE75 - Success states
COLORS.error          // #F75555 - Error states
COLORS.warning        // #FACC15 - Warning states

// Neutral Colors
COLORS.black          // #181A20 - Primary text
COLORS.white          // #FFFFFF - Background
COLORS.gray           // #9E9E9E - Secondary text
COLORS.grayscale700   // #616161 - Muted text
```

### Typography

Font system with consistent sizing and weights:

```typescript
import { FONTS } from '../constants';

FONTS.largeTitle  // 50px - Hero text
FONTS.h1          // 36px - Main headings
FONTS.h2          // 22px - Section headings
FONTS.h3          // 16px - Subsection headings
FONTS.body1       // 30px - Large body text
FONTS.body2       // 20px - Medium body text
FONTS.body3       // 16px - Regular body text
FONTS.body4       // 14px - Small body text
```

### Spacing

Consistent spacing system using SIZES:

```typescript
import { SIZES } from '../constants';

SIZES.base        // 8px - Base unit
SIZES.padding     // 8px - Small padding
SIZES.padding2    // 12px - Medium padding
SIZES.padding3    // 16px - Large padding
SIZES.radius      // 30px - Border radius
```

## 🔘 Button Components

### Primary Button
Main action button with filled background.

```typescript
import Button from '../components/Button';

<Button 
    title="Primary Button" 
    filled={true} 
    onPress={() => {}} 
/>
```

**Props:**
- `title: string` - Button text
- `filled?: boolean` - Filled or outlined style
- `color?: string` - Custom background color
- `isLoading?: boolean` - Loading state
- `onPress: () => void` - Press handler

### Secondary Button
Outlined button for secondary actions.

```typescript
<Button 
    title="Secondary Button" 
    filled={false} 
    onPress={() => {}} 
/>
```

### Loading Button
Button with loading spinner.

```typescript
<Button 
    title="Loading..." 
    filled={true} 
    isLoading={true} 
    onPress={() => {}} 
/>
```

### Custom Color Button
Button with custom color scheme.

```typescript
<Button 
    title="Success" 
    filled={true} 
    color={COLORS.success} 
    onPress={() => {}} 
/>
```

## 📝 Input Components

### Basic Input
Standard text input field.

```typescript
import Input from '../components/Input';

<Input
    id="basic"
    placeholder="Enter your text"
    onInputChanged={(id, text) => setValue(text)}
/>
```

**Props:**
- `id: string` - Unique identifier
- `placeholder?: string` - Placeholder text
- `icon?: string` - Leading icon
- `errorText?: string` - Error message
- `onInputChanged: (id, text) => void` - Change handler

### Input with Icon
Text input with leading icon.

```typescript
<Input
    id="email"
    placeholder="Email address"
    icon={icons.email}
    keyboardType="email-address"
    onInputChanged={(id, text) => setValue(text)}
/>
```

### Password Input
Secure text input for passwords.

```typescript
<Input
    id="password"
    placeholder="Password"
    secureTextEntry={true}
    icon={icons.lock}
    onInputChanged={(id, text) => setValue(text)}
/>
```

## 🎴 Card Components

### Payment Card
Credit/debit card display component.

```typescript
import Card from '../components/Card';

<Card
    number="**** **** **** 1234"
    balance="2,540.00"
    date="12/25"
    onPress={() => {}}
/>
```

**Props:**
- `number: string` - Card number (masked)
- `balance: string` - Account balance
- `date: string` - Expiry date
- `onPress?: () => void` - Press handler

### Task Card
Task item with status and details.

```typescript
import TaskCard from '../components/TaskCard';

<TaskCard
    name="UI Design"
    description="Create mobile app interface"
    date="Today"
    status="In Progress"
    onPress={() => {}}
/>
```

### Project Card
Complex project card with progress tracking.

```typescript
import ProjectCard from '../components/ProjectCard';

<ProjectCard
    id="1"
    name="Mobile App"
    description="iOS and Android app"
    image="project-image.jpg"
    status="active"
    numberOfTask={10}
    numberOfTaskCompleted={6}
    numberOfDaysLeft={15}
    logo="company-logo.png"
    members={["avatar1.jpg", "avatar2.jpg"]}
    endDate="2024-02-15"
    onPress={() => {}}
/>
```

## 🎯 Icon System

The app includes 200+ icons organized into categories:

### Navigation Icons
```typescript
import { icons } from '../constants';

icons.home
icons.search
icons.user
icons.chat
icons.bell
```

### Action Icons
```typescript
icons.edit
icons.trash
icons.share
icons.download
icons.upload
```

### Social Icons
```typescript
icons.facebook
icons.google
icons.apple
icons.instagram
icons.twitter
```

### Usage Example
```typescript
import { Image } from 'react-native';
import { icons, COLORS } from '../constants';

<Image 
    source={icons.home} 
    style={[styles.icon, { tintColor: COLORS.primary }]} 
/>
```

## 🖼️ Layout Patterns

### Header Layout
Standard header with back button and title.

```typescript
<View style={styles.header}>
    <TouchableOpacity onPress={() => router.back()}>
        <Image source={icons.arrowLeft} style={styles.backIcon} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Page Title</Text>
    <TouchableOpacity>
        <Image source={icons.moreVertical} style={styles.moreIcon} />
    </TouchableOpacity>
</View>

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding3,
        paddingVertical: SIZES.padding2,
    },
    headerTitle: {
        ...FONTS.h3,
        flex: 1,
        textAlign: 'center',
    }
});
```

### List Layout
Standard list item layout.

```typescript
<View style={styles.listItem}>
    <Image source={icons.user} style={styles.listIcon} />
    <View style={styles.listContent}>
        <Text style={styles.listTitle}>Item Title</Text>
        <Text style={styles.listSubtitle}>Item subtitle</Text>
    </View>
    <Image source={icons.arrowRight} style={styles.chevron} />
</View>
```

### Card Grid Layout
Grid layout for cards.

```typescript
<View style={styles.cardGrid}>
    <View style={styles.cardItem}>
        {/* Card content */}
    </View>
    <View style={styles.cardItem}>
        {/* Card content */}
    </View>
</View>

const styles = StyleSheet.create({
    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    cardItem: {
        width: (SIZES.width - 60) / 2,
        marginBottom: SIZES.padding3,
    }
});
```

## 🎨 Theme Support

The app supports both light and dark themes:

```typescript
import { useTheme } from '../theme/ThemeProvider';

const MyComponent = () => {
    const { dark } = useTheme();
    
    return (
        <View style={[
            styles.container, 
            { backgroundColor: dark ? COLORS.dark2 : COLORS.white }
        ]}>
            <Text style={[
                styles.text, 
                { color: dark ? COLORS.white : COLORS.black }
            ]}>
                Theme-aware text
            </Text>
        </View>
    );
};
```

## 📱 Common Patterns

### Form Layout
Standard form with inputs and button.

```typescript
<View style={styles.form}>
    <Input
        id="name"
        placeholder="Full Name"
        icon={icons.user}
        onInputChanged={handleInputChange}
    />
    <Input
        id="email"
        placeholder="Email"
        icon={icons.email}
        keyboardType="email-address"
        onInputChanged={handleInputChange}
    />
    <Button
        title="Submit"
        filled={true}
        onPress={handleSubmit}
        style={styles.submitButton}
    />
</View>
```

### Modal Layout
Standard modal with header and content.

```typescript
<View style={styles.modal}>
    <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Modal Title</Text>
        <TouchableOpacity onPress={closeModal}>
            <Image source={icons.close} style={styles.closeIcon} />
        </TouchableOpacity>
    </View>
    <View style={styles.modalContent}>
        {/* Modal content */}
    </View>
</View>
```

### Tab Layout
Tab navigation pattern.

```typescript
<View style={styles.tabContainer}>
    {tabs.map((tab, index) => (
        <TouchableOpacity
            key={index}
            style={[
                styles.tab,
                { backgroundColor: activeTab === tab ? COLORS.primary : 'transparent' }
            ]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={[
                styles.tabText,
                { color: activeTab === tab ? COLORS.white : COLORS.gray }
            ]}>
                {tab}
            </Text>
        </TouchableOpacity>
    ))}
</View>
```

## 🔧 Utility Components

### Loading Spinner
```typescript
import { ActivityIndicator } from 'react-native';

<ActivityIndicator size="large" color={COLORS.primary} />
```

### Separator
```typescript
<View style={[styles.separator, { backgroundColor: COLORS.grayscale200 }]} />

const styles = StyleSheet.create({
    separator: {
        height: 1,
        marginVertical: SIZES.padding2,
    }
});
```

### Empty State
```typescript
<View style={styles.emptyState}>
    <Image source={icons.folder} style={styles.emptyIcon} />
    <Text style={styles.emptyTitle}>No items found</Text>
    <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
</View>
```

## 📚 Component Library Categories

### 1. **Buttons**
- Primary Button
- Secondary Button  
- Loading Button
- Icon Button
- Floating Action Button

### 2. **Inputs**
- Text Input
- Password Input
- Search Input
- Multiline Input
- Date Picker

### 3. **Cards**
- Payment Card
- Task Card
- Project Card
- Info Card
- Image Card

### 4. **Icons**
- Navigation Icons (20+)
- Action Icons (30+)
- Social Icons (10+)
- UI Icons (50+)
- Custom Icons (100+)

### 5. **Layout**
- Header Layouts
- List Layouts
- Grid Layouts
- Modal Layouts
- Tab Layouts

### 6. **Navigation**
- Tab Navigation
- Stack Navigation
- Drawer Navigation
- Bottom Sheets

### 7. **Feedback**
- Alerts
- Toasts
- Loading States
- Empty States
- Error States

## 🚀 Usage Tips

1. **Consistent Spacing**: Always use `SIZES` constants for consistent spacing
2. **Theme Awareness**: Use `useTheme()` hook for theme-aware components
3. **Icon Tinting**: Use `tintColor` prop to match icons with your theme
4. **Reusable Styles**: Create reusable style objects for common patterns
5. **Performance**: Use `StyleSheet.create()` for better performance

## 📖 How to Use This Guide

1. **Browse Categories**: Use the interactive UI Library to explore components
2. **Copy Code**: Click the copy button next to any code example
3. **Customize**: Modify colors, sizes, and styles to match your needs
4. **Extend**: Build upon existing components to create new variants
5. **Contribute**: Add new components following the established patterns

## 🔗 Related Files

- `constants/theme.ts` - Color palette and typography
- `constants/icons.ts` - Icon library
- `components/` - Reusable components
- `styles/CommonStyles.js` - Common styling patterns
- `theme/ThemeProvider.tsx` - Theme context and utilities

---

*This guide is a living document. Update it as you add new components or modify existing ones.* 