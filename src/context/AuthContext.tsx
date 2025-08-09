import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useToast, Center, Spinner } from '@chakra-ui/react';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isFinance: boolean;
  isEditor: boolean;
  user: any | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  isFinance: false,
  isEditor: false,
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFinance, setIsFinance] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const handleAuthChange = async (session: Session | null) => {
    try {
      if (!session?.user?.id) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsFinance(false);
        setIsEditor(false);
        setUser(null);
        return;
      }

      // Check if the user is the finance user
      if (session.user.email === 'dhanush@axisogreen.in') {
        setIsFinance(true);
      } else {
        setIsFinance(false);
      }

      // Check if the user has edit permissions (admin or contact)
      if (session.user.email === 'admin@axisogreen.in' || session.user.email === 'contact@axisogreen.in') {
        setIsEditor(true);
      } else {
        setIsEditor(false);
      }

      // First check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        // If user doesn't exist in users table, create them
        if (userError.code === 'PGRST116') {
          // If it's the finance user, set their role accordingly
          const role = session.user.email === 'dhanush@axisogreen.in' ? 'finance' : 'user';
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,  // Explicitly include the ID
              email: session.user.email,
              role: role // Set appropriate role
            });

          if (insertError) {
            console.error('Error creating user:', insertError);
            // Continue with authentication but log the error
          }
          
          // We know this is not an admin user since we're creating it as 'finance' or 'user'
          setIsAdmin(false);
        } else {
          console.error('Error fetching user role:', userError);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(userData?.role === 'admin');
      }

      setUser(session.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error handling auth change:', error);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsFinance(false);
      setIsEditor(false);
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          await handleAuthChange(session);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        handleAuthChange(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Check if the user is the finance user
        if (email === 'dhanush@axisogreen.in') {
          setIsFinance(true);
        } else {
          setIsFinance(false);
        }

        // Check if the user has edit permissions
        if (email === 'admin@axisogreen.in' || email === 'contact@axisogreen.in') {
          setIsEditor(true);
        } else {
          setIsEditor(false);
        }
        
        // Check if user exists in users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('email', email)
          .single();

        if (userError) {
          // If user doesn't exist, create one with appropriate role
          const role = email === 'dhanush@axisogreen.in' ? 'finance' : 'user';
          
          const { error: insertError } = await supabase
            .from('users')
            .insert([{ 
              id: data.user.id,  // Explicitly set the id from auth
              email, 
              role 
            }]);

          if (insertError) {
            console.error('Error creating user record:', insertError);
            // Continue with login even if user record creation fails
          } else {
            console.log('Created new user record successfully');
          }
          
          // We know this is not an admin user since we're creating it as 'finance' or 'user'
          setIsAdmin(false);
        } else {
          setIsAdmin(userData.role === 'admin');
        }

        toast({
          title: 'Login successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Redirect all users to dashboard
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const logout = async () => {
    try {
      // Always clear local state first
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsFinance(false);
      setIsEditor(false);
      setUser(null);

      // Try to sign out from Supabase, but don't fail if session is missing
      try {
        const { error } = await supabase.auth.signOut();
        if (error && !error.message?.includes('Auth session missing')) {
          // Only throw if it's not a session missing error
          throw error;
        }
      } catch (signOutError: any) {
        // Ignore session missing errors
        if (!signOutError.message?.includes('Auth session missing') &&
            !signOutError.name?.includes('AuthSessionMissingError')) {
          throw signOutError;
        }
      }

      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);

      // Always navigate to login even if logout fails
      navigate('/login');

      toast({
        title: 'Logout completed',
        description: 'You have been logged out',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, isFinance, isEditor, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
