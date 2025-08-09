import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  useToast,
  Link as ChakraLink,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  IconButton,
  VStack,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDownIcon } from '@chakra-ui/icons';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItemProps {
  icon: string;
  label: string;
  to: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, isActive, onClick }) => (
  <ChakraLink
    as={RouterLink}
    to={to}
    onClick={onClick}
    display="flex"
    alignItems="center"
    px={4}
    py={3}
    borderRadius="lg"
    bg={isActive ? 'green.50' : 'transparent'}
    color={isActive ? 'green.600' : 'gray.600'}
    fontWeight={isActive ? 'semibold' : 'medium'}
    _hover={{
      bg: isActive ? 'green.100' : 'gray.50',
      color: isActive ? 'green.700' : 'gray.700',
      textDecoration: 'none',
      transform: 'translateX(2px)',
    }}
    transition="all 0.2s"
    border="1px solid"
    borderColor={isActive ? 'green.200' : 'transparent'}
  >
    <Text fontSize="lg" mr={3}>{icon}</Text>
    <Text fontSize="sm">{label}</Text>
  </ChakraLink>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout, isFinance, user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');

  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error signing out',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const navigationItems = [
    { icon: '📊', label: 'Dashboard', to: '/dashboard' },
    { icon: '📈', label: 'Projects', to: '/projects' },
    { icon: '📦', label: 'Modules', to: '/modules' },
    { icon: '📋', label: 'Reports', to: '/reports' },
    { icon: '🎫', label: 'Service Tickets', to: '/service-tickets' },
  ];

  const financeItems = [
    { icon: '💰', label: 'Finance', to: '/finance' },
    { icon: '💳', label: 'Payments', to: '/payments' },
  ];

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <Box>
      <Flex direction="column" h="full">
        <Box p={6}>
          <Flex align="center" justify="center" mb={8}>
            <Text fontSize="4xl" mr={2}>🔋</Text>
            <Text fontSize="3xl">🍃</Text>
          </Flex>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="green.600"
            textAlign="center"
            mb={2}
          >
            Axiso Green Energy
          </Text>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Sustainable Energy Platform
          </Text>
        </Box>

        <VStack spacing={2} px={4} flex="1">
          {navigationItems.map((item) => (
            <NavItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.pathname === item.to || location.pathname.includes(item.to)}
              onClick={onClose}
            />
          ))}

          {isFinance && (
            <>
              <Box w="full" my={4}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.400" px={4} mb={2}>
                  FINANCE
                </Text>
              </Box>
              {financeItems.map((item) => (
                <NavItem
                  key={item.to}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  isActive={location.pathname === item.to}
                  onClick={onClose}
                />
              ))}
            </>
          )}
        </VStack>

        <Box p={4}>
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              leftIcon={<Avatar size="sm" name={user?.email} />}
              rightIcon={<ChevronDownIcon />}
              textAlign="left"
              fontSize="sm"
            >
              <Box>
                <Text fontWeight="medium" isTruncated>
                  {user?.email?.split('@')[0] || 'User'}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {isFinance ? 'Finance User' : 'Standard User'}
                </Text>
              </Box>
            </MenuButton>
            <MenuList>
              <MenuItem
                icon={<Text>🚪</Text>}
                onClick={handleSignOut}
                fontSize="sm"
                color="red.500"
              >
                Sign Out
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Flex>
    </Box>
  );

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Mobile Navigation */}
      <Flex
        display={{ base: 'flex', lg: 'none' }}
        as="nav"
        align="center"
        justify="space-between"
        padding="4"
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        position="sticky"
        top="0"
        zIndex="sticky"
      >
        <Flex align="center">
          <Text fontSize="2xl" mr={2}>🔋</Text>
          <Text fontSize="lg" fontWeight="bold" color="green.600">
            Axiso
          </Text>
        </Flex>
        <IconButton
          aria-label="Open menu"
          icon={<Text>☰</Text>}
          variant="ghost"
          onClick={onOpen}
        />
      </Flex>

      {/* Desktop Layout */}
      <Flex>
        {/* Desktop Sidebar */}
        <Box
          display={{ base: 'none', lg: 'block' }}
          w="280px"
          bg={sidebarBg}
          borderRight="1px"
          borderColor={borderColor}
          position="fixed"
          h="100vh"
          overflowY="auto"
        >
          <SidebarContent />
        </Box>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent bg={sidebarBg}>
            <DrawerCloseButton />
            <DrawerBody p={0}>
              <SidebarContent onClose={onClose} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box
          flex="1"
          ml={{ base: 0, lg: '280px' }}
          transition="margin-left 0.2s"
        >
          <Box p={6}>
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;
