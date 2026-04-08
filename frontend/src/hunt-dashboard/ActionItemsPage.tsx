import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchActionItems,
  updateActionItem,
  deleteActionItem,
  type ActionItem,
} from "../api/actionItems";
import AddActionItemDialog from "./AddActionItemDialog";
import NavBar from "../shared/NavBar";
import {
  surface,
  onSurface,
  onSurfaceVariant,
  outlineVariant,
  borderSubtle,
  surfaceContainerLowest,
  error,
} from "../colors";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ActionItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "open";
  const [addOpen, setAddOpen] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["actionItems", { status }],
    queryFn: () => fetchActionItems({ status }),
  });

  const handleStatusChange = (
    _: React.MouseEvent<HTMLElement>,
    newStatus: string | null,
  ) => {
    if (newStatus) setSearchParams({ status: newStatus });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: surface }}>
      <NavBar activeLink="hunt-tracker" />

      <Box
        component="main"
        sx={{ pt: "80px", px: 4, pb: 6, maxWidth: 860, mx: "auto" }}
      >
        <Box
          sx={{
            mb: 4,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { sm: "flex-end" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 800,
                color: onSurface,
                mb: 0.5,
              }}
            >
              Action Items
            </Typography>
            <Typography sx={{ color: onSurfaceVariant, fontSize: 14 }}>
              Track tasks and follow-ups across your job hunt.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setAddOpen(true)}
            sx={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
            }}
          >
            + Add Task
          </Button>
        </Box>

        <ToggleButtonGroup
          value={status}
          exclusive
          onChange={handleStatusChange}
          size="small"
          sx={{ mb: 3 }}
        >
          <ToggleButton
            value="open"
            sx={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 600,
              textTransform: "none",
              px: 2,
            }}
          >
            Open
          </ToggleButton>
          <ToggleButton
            value="completed"
            sx={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 600,
              textTransform: "none",
              px: 2,
            }}
          >
            Completed
          </ToggleButton>
        </ToggleButtonGroup>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : !items || items.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" sx={{ color: onSurfaceVariant, mb: 1 }}>
              No {status} tasks.
            </Typography>
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${borderSubtle}`,
              bgcolor: surfaceContainerLowest,
            }}
          >
            <Stack spacing={0}>
              {items.map((item) => (
                <ActionItemRow key={item.actionItemId} item={item} />
              ))}
            </Stack>
          </Paper>
        )}
      </Box>

      <AddActionItemDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </Box>
  );
}

function ActionItemRow({ item }: { item: ActionItem }) {
  const qc = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: () =>
      updateActionItem(item.actionItemId, {
        status: item.status === "open" ? "completed" : "open",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["actionItems"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteActionItem(item.actionItemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["actionItems"] }),
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${borderSubtle}`,
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Checkbox
        size="small"
        checked={item.status === "completed"}
        disabled={completeMutation.isPending}
        onChange={() => completeMutation.mutate()}
        sx={{ mt: -0.5, color: outlineVariant }}
      />
      <Box sx={{ flex: 1, minWidth: 0, ml: 0.5 }}>
        <Typography
          sx={{
            fontSize: 14,
            color: item.status === "completed" ? outlineVariant : onSurface,
            textDecoration:
              item.status === "completed" ? "line-through" : "none",
          }}
        >
          {item.description}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 0.5, flexWrap: "wrap" }}>
          {item.dueDate && (
            <Typography sx={{ fontSize: 12, color: onSurfaceVariant }}>
              Due {formatDate(item.dueDate)}
            </Typography>
          )}
          <Typography sx={{ fontSize: 12, color: outlineVariant }}>
            Created {formatDate(item.createDate.slice(0, 10))}
          </Typography>
        </Box>
      </Box>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          sx={{ color: error, ml: 1 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            delete
          </span>
        </IconButton>
      </Tooltip>
    </Box>
  );
}
