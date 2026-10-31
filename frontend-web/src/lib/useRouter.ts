import { useMemo } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const queryParams = Object.fromEntries(searchParams.entries());

    return {
      push: (path: string) => navigate(path),
      replace: (path:string) => navigate(path, { replace: true }),
      back: () => navigate(-1),
      
      pathname: location.pathname,
      
      query: {
        ...queryParams,
        ...params,
      },

      state: location.state,
    };
  }, [navigate, location, params, searchParams]);
}