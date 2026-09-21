import AssessmentIcon from "@mui/icons-material/Assessment";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function App() {
  const [transcript, setTranscript] = useState("");

  return (
    <Box className="appShell">
      <Container maxWidth="md" className="workspace">
        <Paper className="pronunciationPanel" elevation={0}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" component="h1">
                Pronunciation Check
              </Typography>
              <Typography>
                Polish word and scoring data
              </Typography>
            </Box>

            <Box className="wordPlaceholder">
              <Typography variant="overline" color="text.secondary">
                Polish Word
              </Typography>
              <Typography className="targetWord" color="text.secondary">


                 {/* this is where the word will go from the backend */}


              </Typography>
            </Box>

            <TextField
              label="Transcript"
              placeholder="Transcript from speech recognition will appear here"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              fullWidth
            />

            <Button variant="contained">
              Check Pronunciation
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
