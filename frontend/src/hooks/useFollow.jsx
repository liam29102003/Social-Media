import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const useFollow = () => {
    const queryClient = useQueryClient();
    const { mutate:follow, isPending} = useMutation({
        mutationFn: async (userId) => {
            try {
                const res = await fetch(`/api/users/follow/${userId}`,
                    {
                        method: 'POST',
                    }
                );
                const data = await res.json();
                if(!res.ok) throw new Error(data.error || "Something went wrong");
                return data;
            } catch (error) {
                throw new Error(error);
            }
            
        },
        onSuccess: async (data) => {
            Promise.all([
            await queryClient.invalidateQueries({queryKey:['suggestedUser']}),
            await queryClient.invalidateQueries({queryKey:['authUser']}),
        ])
            toast.success('Followed');
        },
        onError: (error) => {
            toast.error(error.message);
        }

    })
    return {follow, isPending}

}
export default useFollow
