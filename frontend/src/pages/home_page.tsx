import { Box, Button, Container, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import HearingOutlinedIcon from "@mui/icons-material/HearingOutlined";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import { Link } from "react-router-dom";

const steps = [
    { number: "01", icon: <AutoStoriesOutlinedIcon />, title: "Choose a Word", text: "Explore your course vocabulary and choose a Polish word you'd like to practice." },
    { number: "02", icon: <HearingOutlinedIcon />, title: "Listen and Practice", text: "Listen to the Polish pronunciation, then record yourself saying the word." },
    { number: "03", icon: <GraphicEqRoundedIcon />, title: "Analyze Your Pronunciation", text: "See feedback for your recording, See if you need to improve, and give it another try." },
];

export default function HomePage() {
    return (
        <>
            <Container maxWidth="lg">
                <Box className="homeIntro">
                <Box component="section" className="hero" aria-labelledby="hero-heading">
                    <Box className="heroCopy">
                        <Typography component="h1" id="hero-heading" className="heroTitle">
                            Master Polish<br /><span>pronunciation</span>
                        </Typography>
                        <Typography className="heroDescription">A little practice goes a long way. Build your confidence in speaking Polish with interactive word practice and pronunciation feedback.</Typography>
                        <Box className="heroActions">
                            <Button component={Link} to="/practice" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />}>Start Learning</Button>
                            <Button component={Link} to="/#about" variant="text">Get to know Mówka </Button>
                        </Box>
                        <Typography className="heroNote"><MicNoneRoundedIcon aria-hidden="true" /> Your voice. Your pace. One word at a time.</Typography>
                    </Box>
                </Box>
                <Box className="learningStrip">
                    <span><AutoStoriesOutlinedIcon /> Course vocabulary</span>
                    <span><HearingOutlinedIcon /> Listen & repeat</span>
                    <span><GraphicEqRoundedIcon /> Pronunciation feedback</span>
                </Box>
                </Box>

                <Box component="section" id="about" tabIndex={-1} className="aboutSection" aria-labelledby="about-heading">
                    <Box>
                        <Typography className="eyebrow">ABOUT US</Typography>
                        <Typography component="h2" id="about-heading" className="sectionTitle">Learn Polish Prounanciation<br /></Typography>
                        <Typography color="text.secondary" className="sectionDescription">Speaking a new language takes practice, patience, and a place to begin. That's why we built Mówka.</Typography>
                        <Typography color="text.secondary" className="sectionDescription">Created as a university senior design project, Mówka brings together speech recognition, interactive word practice, and pronunciation feedback to help learners speak Polish with greater confidence.</Typography>
                    </Box>
                    <Box className="aboutFeatures">
                        <Box className="aboutFeature"><span className="featureIcon"><AutoStoriesOutlinedIcon /></span><div><Typography component="h3" variant="h6">Real words. Meaningful practice.</Typography><Typography color="text.secondary">Learn from your course's Polish vocabulary with English translations and pronunciation hints.</Typography></div></Box>
                        <Box className="aboutFeature"><span className="featureIcon pinkIcon"><HearingOutlinedIcon /></span><div><Typography component="h3" variant="h6">Listen, then make it your own.</Typography><Typography color="text.secondary">Use browser audio as a practice aid, record your voice, and repeat at your own pace.</Typography></div></Box>
                        <Box className="aboutFeature"><span className="featureIcon"><GraphicEqRoundedIcon /></span><div><Typography component="h3" variant="h6">Feedback for your next step.</Typography><Typography color="text.secondary">See how closely the recognized speech matches your word, with feedback on your latest attempt.</Typography></div></Box>
                    </Box>
                </Box>
            </Container>

            <Box component="section" className="howSection" aria-labelledby="how-heading">
                <Container maxWidth="lg">
                    <Box className="sectionHeading"><Typography className="eyebrow">SMALL STEPS. MORE CONFIDENCE.</Typography><Typography component="h2" id="how-heading" className="sectionTitle">Your next word starts here.</Typography></Box>
                    <Box className="stepsGrid">
                        {steps.map(step => <Box key={step.number} className="stepCard"><div className="stepTop"><span className="stepIcon">{step.icon}</span><span className="stepNumber">{step.number}</span></div><Typography component="h3" variant="h6">{step.title}</Typography><Typography color="text.secondary">{step.text}</Typography></Box>)}
                    </Box>
                    <Typography className="voiceFootnote" color="text.secondary">Listening uses your browser's available voices. Polish voice availability and pronunciation quality vary by device.</Typography>
                </Container>
            </Box>

            <Container maxWidth="lg">
                <Box component="section" className="courseCta" aria-labelledby="cta-heading"><Box><Typography className="eyebrow">LET'S PUT IT INTO PRACTICE</Typography><Typography component="h2" id="cta-heading" className="sectionTitle">A more confident Polish<br />begins with one word.</Typography><Typography>Take a breath. Choose a course. Give it a try.</Typography></Box>
                <Button component={Link} to="/practice" variant="contained" color="secondary" size="large" endIcon={<ArrowForwardRoundedIcon />}>Explore Courses</Button></Box>
            </Container>
        </>
    );
}
