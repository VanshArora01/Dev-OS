import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createSession } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";

const formSchema = z.object({
    summary: z.string().min(5, "Summary must be at least 5 characters"),
    nextPlan: z.string().min(5, "Next plan must be at least 5 characters"),
    durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
});

interface SessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    projectId: string;
}

export default function SessionModal({
    isOpen,
    onClose,
    onSuccess,
    projectId,
}: SessionModalProps) {
    const [loading, setLoading] = useState(false);
    const { user } = useUser();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            summary: "",
            nextPlan: "",
            durationMinutes: 30,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) {
            toast.error("You must be logged in to log a session");
            return;
        }

        setLoading(true);
        try {
            await createSession({
                summary: values.summary,
                nextStep: values.nextPlan,
                durationMinutes: values.durationMinutes,
                projectId,
                clerkId: user.id,
            });
            toast.success("Work session logged successfully!");
            onSuccess();
            onClose();
            form.reset();
        } catch (error: any) {
            toast.error(error.message || "Failed to log session");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#0A0A0B] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Log Work Session</DialogTitle>
                    <DialogDescription className="text-white/60">
                        Record what you accomplished and what's next.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>What did you work on?</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Implemented the auth middleware and fixed CORS issues..."
                                            {...field}
                                            className="bg-white/5 border-white/10 min-h-[100px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nextPlan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>What is next in line?</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Connect the frontend to the new session endpoints..."
                                            {...field}
                                            className="bg-white/5 border-white/10 min-h-[80px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="durationMinutes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration (Minutes)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest mt-2 h-12"
                        >
                            {loading ? "Saving..." : "End & Save Session"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
