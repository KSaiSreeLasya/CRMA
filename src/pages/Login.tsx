import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Text,
  Container,
  Spinner,
  Center,
  Flex,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Heading,
  Stack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EmailIcon, LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
// No react-icons imports needed

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { login, isAuthenticated, isLoading } = useAuth();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      await login(email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh" bg={bgColor}>
        <VStack spacing={4}>
          <Text fontSize="6xl" color="green.500">🔋</Text>
          <Spinner size="xl" color="green.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">Loading...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Stack spacing="8">
          <Stack spacing="6">
            <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
              <Flex justify="center" align="center" mb={4}>
                <Text fontSize="4xl" color="green.500" mr={2}>🔋</Text>
                <Text fontSize="3xl" color="green.400">🍃</Text>
              </Flex>
              <Heading size={{ base: 'xs', md: 'sm' }} color="green.600">
                Axiso Green Energy
              </Heading>
              <Text color="gray.600">
                Sustainable Energy Management Platform
              </Text>
            </Stack>
          </Stack>
          <Box
            py={{ base: '8', sm: '12' }}
            px={{ base: '4', sm: '10' }}
            bg={cardBg}
            boxShadow={{ base: 'none', sm: 'xl' }}
            borderRadius={{ base: 'none', sm: 'xl' }}
            border="1px solid"
            borderColor={borderColor}
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              h="4px"
              bgGradient="linear(to-r, green.400, blue.400, purple.400)"
            />
            <form onSubmit={handleLogin}>
              <Stack spacing="6">
                <Stack spacing="5">
                <FormControl isRequired>
                  <FormLabel htmlFor="email" color="gray.600">Email</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <EmailIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your email"
                      _placeholder={{ color: 'gray.400' }}
                      borderColor="gray.300"
                      _hover={{ borderColor: 'green.400' }}
                      _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px #48BB78' }}
                    />
                  </InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel htmlFor="password" color="gray.600">Password</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <LockIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your password"
                      _placeholder={{ color: 'gray.400' }}
                      borderColor="gray.300"
                      _hover={{ borderColor: 'green.400' }}
                      _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px #48BB78' }}
                    />
                    <Button
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      position="absolute"
                      right="0"
                      top="0"
                      h="full"
                      px={3}
                      _hover={{ bg: 'transparent' }}
                    >
                      <Icon as={showPassword ? ViewOffIcon : ViewIcon} color="gray.400" />
                    </Button>
                  </InputGroup>
                </FormControl>
                </Stack>
                <Stack spacing="6">
                  <Button
                    type="submit"
                  bgGradient="linear(to-r, green.400, green.500)"
                  _hover={{
                    bgGradient: 'linear(to-r, green.500, green.600)',
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  color="white"
                  size="lg"
                  fontSize="md"
                  isLoading={loading}
                  loadingText="Signing in..."
                  transition="all 0.2s"
                >
                  Sign In
                </Button>
                <HStack justify="center">
                  <Text fontSize="sm" color="gray.600">
                    Powered by renewable energy solutions
                  </Text>
                </HStack>
                </Stack>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default Login;
