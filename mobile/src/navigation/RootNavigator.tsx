import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import PlannerScreen from '../screens/PlannerScreen';
import RouteScreen from '../screens/RouteScreen';
import SummaryScreen from '../screens/SummaryScreen';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Route" component={RouteScreen} options={{ title: 'Route & Checkpoints' }} />
        <Tab.Screen name="Summary" component={SummaryScreen} options={{ title: 'Trip Summary' }} />
        <Tab.Screen name="Planner" component={PlannerScreen} options={{ title: 'Travel Planner' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
