import { Box, Button, Container, Typography } from "@mui/material";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Link } from "react-router-dom";

export default function HistoryPage() {
    return (
        <Container maxWidth="lg" className="workspace historyWorkspace">
            <Typography className="eyebrow">YOUR LEARNING JOURNEY</Typography>
            <Typography component="h1" variant="h3" className="pageTitle">Practice history</Typography>
            <Typography color="text.secondary">Every attempt is another step forward.</Typography>
            <Box className="historyEmpty">
                <span className="historyIcon"><HistoryRoundedIcon fontSize="large" /></span>
                <Typography className="eyebrow">NOT AVAILABLE YET</Typography>
                <Typography component="h2" variant="h5">Good practice happens in the present.</Typography>
                <Typography color="text.secondary">Practice history isn't available yet, and previous attempts aren't saved. You can see feedback for your latest recording beside the word you're practicing in Courses.</Typography>
                <Button component={Link} to="/practice" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>Continue practicing</Button>
            </Box>
        </Container>
    );
}
